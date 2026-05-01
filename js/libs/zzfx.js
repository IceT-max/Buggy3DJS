// ZzFX ~ Zuper Zmall Zeeded Zound Zynth ~ v1.3.1 by Frank Force
// https://github.com/KilledByAPixel/ZzFX
'use strict';

let zzfxV = .3;       // master volume
let zzfxR = 44100;    // sample rate
let zzfxX = new AudioContext();

// play a zzfx sound
let zzfx = (...z) => zzfxP(zzfxG(...z));

// generate a sound buffer
let zzfxG = (
  volume = 1, randomness = .05, frequency = 220,
  attack = 0, sustain = 0, release = .1,
  shape = 0, shapeCurve = 1,
  slide = 0, deltaSlide = 0,
  pitchJump = 0, pitchJumpTime = 0, repeatTime = 0,
  noise = 0, modulation = 0, bitCrush = 0,
  delay = 0, sustainVolume = 1, decay = 0, tremolo = 0
) => {
  let PI2 = Math.PI * 2;
  let startSlide = slide *= 500 * PI2 / zzfxR / zzfxR;
  let startFrequency = frequency *=
    (1 + randomness * 2 * Math.random() - randomness) * PI2 / zzfxR;
  let b = [], t = 0, tm = 0, i = 0, j = 1, r = 0, c = 0, s = 0;

  attack  = attack  * zzfxR + 9;
  decay   *= zzfxR;
  sustain *= zzfxR;
  release *= zzfxR;
  delay   *= zzfxR;
  deltaSlide    *= 500 * PI2 / zzfxR ** 3;
  modulation    *= PI2 / zzfxR;
  pitchJump     *= PI2 / zzfxR;
  pitchJumpTime *= zzfxR;
  repeatTime     = repeatTime * zzfxR | 0;

  let length = attack + decay + sustain + release + delay | 0;

  for (; i < length; b[i++] = s * volume) {
    if (!(++c % (bitCrush * 100 | 0))) {
      s = shape ? shape > 1 ? shape > 2 ? shape > 3 ?
          Math.sign(Math.cos(t % PI2 ** 2)) :
          (1 - t / PI2 % 2 * 2) :
          1 - 2 * t / PI2 % 2 :
          Math.cos(t) :
          Math.sin(t);

      s = (noise ? 1 - noise + noise * Math.random() * 2 : 1) * s;
      s = (s < 0 ? -1 : 1) * Math.abs(s) ** shapeCurve;
      s *= zzfxV * volume * (
        i < attack ? i / attack :
        i < attack + decay ?
          1 - (i - attack) / decay * (1 - sustainVolume) :
        i < attack + decay + sustain ? sustainVolume :
        i < length - delay ?
          (length - i - delay) / release : 0
      );

      t += frequency + slide + modulation * Math.sin(++tm * modulation);
      frequency += slide += deltaSlide;

      if (j && ++r >= pitchJumpTime) {
        frequency += pitchJump;
        startFrequency += pitchJump;
        j = 0;
      }
      if (repeatTime && !(r % repeatTime)) {
        frequency = startFrequency;
        slide = startSlide;
        j = 1;
        r = 0;
      }
    }
  }
  return b;
};

// play an audio buffer
let zzfxP = (...samples) => {
  let buffer = zzfxX.createBuffer(samples.length, samples[0].length, zzfxR);
  let source = zzfxX.createBufferSource();
  samples.forEach((d, i) => buffer.getChannelData(i).set(d));
  source.buffer = buffer;
  source.connect(zzfxX.destination);
  source.start();
  return source;
};
