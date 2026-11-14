// Solo command scheduling; no WebRTC, STUN or relay transport.
const EMPTY = new Uint8Array(0);
const BOT_LATENCY = 3;
export class Lockstep {
  /**
   * @param {object}  o
   * @param {object}  o.x          wasm exports
   * @param {WebAssembly.Memory} o.memory
   * @param {number[]} o.slots     participating player slots ([0] solo, [0,1] for 1v1)
   * @param {number}  o.localSlot  which of those is us
   * @param {number}  o.delay      input delay in frames (0 solo; a few frames for a peer)
   * @param {(msg:object)=>void} o.send
   */
  constructor({ x, memory, slots, localSlot, delay = 0, send = () => {}, bot = null, shadow = null, bot2 = null, botDelay = BOT_LATENCY }) {
    this.x = x;
    this.memory = memory;
    this.slots = slots.slice();
    this.localSlot = localSlot;
    this.delay = delay;
    this.send = send;
    // Command latency for bot-controlled slots (see BOT_LATENCY); only meaningful with a bot.
    this.botDelay = (bot || bot2) ? botDelay : 0;
    this.botSeeded = false;
    // A local AI producing one slot's turns (vs-Computer). It reads the shared sim and
    // emits BW command bytes just like the human, so it's just another local producer.
    this.bot = bot;   // { slot } or null
    // Bot-vs-bot spectate: a second bot on a second sim replica (`shadow`, a { x, memory }).
    // Each frame both bots' commands are applied to BOTH replicas so they stay bit-identical;
    // the local player is a spectator (no human turn). shadow/bot2 are null for every other mode.
    this.shadow = shadow;
    this.bot2 = bot2;   // { slot } — its bot runs on `shadow`
    this.frame = 0;           // next frame to simulate
    this.nextLocalFrame = 0;  // next frame we still owe a local batch for
    this.turns = new Map();   // frame -> Map(slot -> Uint8Array)
    this.stalledSince = 0;
  }

  #batch(f) {
    let m = this.turns.get(f);
    if (!m) { m = new Map(); this.turns.set(f, m); }
    return m;
  }

  /**
   * A peer's turn arrived. Every turn carries the frame it applies to, and it is only
   * legal inside a narrow window: a turn for a frame we've already simulated can never be
   * applied (lockstep never advances past a missing turn, so it must be a duplicate or a
   * replay), and one far in the future means the peer is out of step or misbehaving.
   * Returns a verdict so the host can drop a peer that sends bad frames.
   */
  receiveTurn(slot, frame, bytes) {
    if (!Number.isInteger(frame) || frame < 0)
      return { ok: false, why: `malformed frame ${frame}` };
    if (frame < this.frame)
      return { ok: false, why: `turn for frame ${frame}, already simulated up to ${this.frame}` };
    if (frame > this.frame + this.horizon())
      return { ok: false, why: `turn for frame ${frame}, too far ahead of ${this.frame}` };
    const b = this.#batch(frame);
    if (b.has(slot))
      return { ok: false, why: `duplicate turn for frame ${frame}` };
    b.set(slot, bytes && bytes.length ? bytes : EMPTY);
    return { ok: true };
  }

  /** How far ahead of the current frame a peer's turn may legitimately be. */
  horizon() { return this.delay * 4 + 8; }

  /** Pull locally generated commands out of the wasm (copy: the buffer is reused). */
  #drainLocal() {
    const len = this.x.openbw_out_len();
    if (!len) return EMPTY;
    const out = new Uint8Array(this.memory.buffer, this.x.openbw_out_ptr(), len).slice();
    this.x.openbw_out_clear();
    return out;
  }

  /** Run the bot's onFrame on a replica and pull its commands (same framing). */
  #drainBot(x = this.x, memory = this.memory) {
    x.openbw_bot_tick();
    const len = x.openbw_bot_out_len();
    if (!len) return EMPTY;
    const out = new Uint8Array(memory.buffer, x.openbw_bot_out_ptr(), len).slice();
    x.openbw_bot_out_clear();
    return out;
  }

  /** Hand one player's batch to a replica. openbw_in_ptr can grow memory, so view after. */
  #apply(slot, bytes, x = this.x, memory = this.memory) {
    if (!bytes || !bytes.length) return;
    const dst = x.openbw_in_ptr(bytes.length);
    new Uint8Array(memory.buffer, dst, bytes.length).set(bytes);
    x.openbw_apply(slot, bytes.length);
  }

  /** Slots we're still waiting on for frame `f`. */
  missing(f) {
    const m = this.turns.get(f);
    return this.slots.filter((s) => !m || !m.has(s));
  }

  /**
   * Advance at most one frame. Returns true if the sim stepped, false if we're waiting
   * on a peer (the caller should render a "waiting" state but keep rendering/input alive).
   */
  tick() {
    // Owe a batch for every frame through frame+delay. On the first tick this also
    // bootstraps the initial `delay` frames with empty batches, so peers immediately have
    // something to consume and nobody deadlocks waiting for turn 0.
    // Seed the first botDelay frames with empty bot batches so the latency window can fill
    // without the step gate stalling (nothing is scheduled to apply there yet).
    if (this.botDelay && !this.botSeeded) {
      this.botSeeded = true;
      for (let f = 0; f < this.botDelay; f++) {
        if (this.bot) this.#batch(f).set(this.bot.slot, EMPTY);
        if (this.bot2) this.#batch(f).set(this.bot2.slot, EMPTY);
      }
    }
    while (this.nextLocalFrame <= this.frame + this.delay) {
      const f = this.nextLocalFrame++;
      const bf = f + this.botDelay;   // a command the bot issues while seeing frame f executes at bf
      if (this.bot2) {
        // Spectate bot-vs-bot: both slots come from bots, each on its own replica. The
        // human is a spectator, so drop whatever their clicks staged (camera/select only).
        this.x.openbw_out_clear();
        this.#batch(bf).set(this.bot.slot, this.#drainBot(this.x, this.memory));
        this.#batch(bf).set(this.bot2.slot, this.#drainBot(this.shadow.x, this.shadow.memory));
      } else {
        const d = this.#drainLocal();
        this.#batch(f).set(this.localSlot, d);
        // The bot is a local producer for its slot: run its onFrame every frame and stage its
        // turn for frame f + botDelay, matching BW's command latency (see BOT_LATENCY).
        if (this.bot) this.#batch(bf).set(this.bot.slot, this.#drainBot());
        if (this.slots.length > 1) this.send({ t: 'turn', f, d });
      }
    }

    if (this.missing(this.frame).length) {
      if (!this.stalledSince) this.stalledSince = Date.now();
      return false;
    }
    this.stalledSince = 0;

    // Apply in slot order so every peer applies in the same order — to both replicas when
    // spectating, keeping them bit-identical.
    const m = this.turns.get(this.frame);
    for (const s of this.slots) {
      this.#apply(s, m.get(s), this.x, this.memory);
      if (this.shadow) this.#apply(s, m.get(s), this.shadow.x, this.shadow.memory);
    }
    this.turns.delete(this.frame);

    this.x.openbw_crossover_ai_tick?.(); this.x.openbw_step();
    if (this.shadow) this.shadow.x.openbw_step();
    this.frame++;
    return true;
  }

  /** How long we've been blocked on a peer, in ms (0 when running). */
  stalledMs() { return this.stalledSince ? Date.now() - this.stalledSince : 0; }

  /**
   * Stop waiting on a slot. NOTE: with more than two players every peer must drop the
   * same slot on the same frame or they diverge; for 1v1 dropping the peer just means
   * continuing solo, so a local decision is safe.
   */
  dropSlot(slot) {
    this.slots = this.slots.filter((s) => s !== slot);
    this.stalledSince = 0;
  }
}
