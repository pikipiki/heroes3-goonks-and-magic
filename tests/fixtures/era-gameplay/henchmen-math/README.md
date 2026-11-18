Bounded Henchmen math regression fixture

The test suite runs `node test-math.cjs work/vcmi-wasm/lib/era/EraHenchmanRules.h` from the project root. No DLL, Windows bytecode,
Emscripten installation or extracted ELF is needed at runtime. The optional
header path makes an outdated probe fail explicitly after the source changes.

The probe exports the actual `heroExperienceRoot` and `alternativeLevelRate`
functions from the header identified in provenance.json. Its raw float wrapper
duplicates the helper's unexposed `pow(double(baseSingle),double(3.0f/5.0f))`
followed by Single rounding. Direct powf is a separate comparison export, not
the helper's implementation. Regenerate the probe and review the vectors when
the header changes; the pinned module alone cannot detect an engine regression.

The selected golden vectors were observed from the original extracted math
under both explicit x87 control words. They cover positive XP gains, sampled
integer boundaries, costs around fifth powers, float input rounding near
INTMAX, known powf one-ULP discrepancies and all three cost selector branches.
They contain numeric observations and hashes only, no Windows executable
bytes. The complete million-cost experiment remains in the ignored parent
artifact directory. This finite fixture and that experiment do not prove the
whole int32 domain, Windows exception behavior or ERA's actual FPU state.

Original instruction execution used a container reporting x86_64 on an ARM64
host and Docker daemon; the translation backend was not identified. The probe
is the actual header compiled with matching relevant production optimization,
C++20, exception and pthread flags, not a call into the full published game.
