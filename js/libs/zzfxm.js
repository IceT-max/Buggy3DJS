// ZzFXM - ZzFX Music - v2.0.3 by Keith Clark
// https://github.com/keithclark/ZzFXM
'use strict';

/**
 * Generates audio buffer for a ZzFXM song.
 * Song format: [instruments, patterns, sequence, bpm]
 *   instruments : array of ZzFX parameter arrays (omit volume as first param)
 *   patterns    : array of patterns; each pattern = array of channels
 *                 channel = [volume, panning, ...notes]
 *                 note    = [instrument_index(1-based), semitone_offset] | 0 (rest)
 *   sequence    : array of pattern indices
 *   bpm         : beats per minute
 * Returns [leftChannel, rightChannel] Float32Arrays ready for zzfxP().
 */
let zzfxM = (instruments, patterns, sequence, BPM = 125) => {
  let i, j, k;
  let instrumentCount = instruments.length;
  let sampleRate = zzfxR;
  let stepTime = 60 / BPM / 4;          // duration of one 16th-note step (seconds)
  let stepSamples = stepTime * sampleRate | 0;

  // build per-instrument sample cache: note -> buffer
  let cache = instruments.map(() => ({}));

  let getSample = (instrIdx, semitone) => {
    let key = semitone;
    if (!cache[instrIdx][key]) {
      let params = [...instruments[instrIdx]];
      // params[2] is frequency; apply semitone shift
      let baseFreq = params[2] || 220;
      params[2] = baseFreq * 2 ** (semitone / 12);
      cache[instrIdx][key] = zzfxG(...params);
    }
    return cache[instrIdx][key];
  };

  // calculate total output length
  let totalSteps = sequence.reduce((acc, pi) => {
    let pat = patterns[pi];
    let len = 0;
    for (let ch of pat) len = Math.max(len, (ch.length - 2));
    return acc + len;
  }, 0);

  let totalSamples = totalSteps * stepSamples;
  let left  = new Float32Array(totalSamples);
  let right = new Float32Array(totalSamples);

  let cursor = 0; // output sample cursor

  for (let pi of sequence) {
    let pattern = patterns[pi];
    let patSteps = 0;
    for (let ch of pattern) patSteps = Math.max(patSteps, ch.length - 2);

    for (let step = 0; step < patSteps; step++) {
      let outOffset = cursor + step * stepSamples;

      for (let ch of pattern) {
        let vol = ch[0];
        let pan = ch[1];     // -1 (left) .. 0 (centre) .. 1 (right)
        let note = ch[step + 2];
        if (!note) continue;

        let [instrIdx, semitone] = note;
        instrIdx = (instrIdx | 0) - 1;        // convert 1-based to 0-based
        if (instrIdx < 0 || instrIdx >= instrumentCount) continue;

        let buf = getSample(instrIdx, semitone | 0);
        let gainL = vol * (pan > 0 ? 1 - pan : 1);
        let gainR = vol * (pan < 0 ? 1 + pan : 1);

        for (let s = 0; s < buf.length && outOffset + s < totalSamples; s++) {
          left [outOffset + s] += buf[s] * gainL;
          right[outOffset + s] += buf[s] * gainR;
        }
      }
    }
    cursor += patSteps * stepSamples;
  }

  return [left, right];
};
