// Render may return a gateway error or hold the first request while waking up.
// Only use this for reads and requests the server can safely receive twice.
export async function requestHostedMatch(url, options, onWait) {
  const deadline = performance.now() + 95000;
  let delay = 750;
  for (;;) {
    let response, failure;
    try {
      response = await fetch(url, {...options, signal: AbortSignal.timeout(
        Math.max(1, Math.min(60000, Math.ceil(deadline - performance.now()))))});
      if (![502, 503, 504].includes(response.status)) return response;
    } catch (error) {
      if (error.name !== 'TimeoutError' && !(error instanceof TypeError)) throw error;
      failure = error;
    }
    if (performance.now() + delay >= deadline) {
      if (failure) throw failure;
      return response;
    }
    onWait?.();
    await new Promise(resolve => setTimeout(resolve, delay));
    delay = Math.min(delay * 2, 3000);
  }
}
