//
// Available modules include (this is not a complete list):
// var Scene = require('Scene');
// var Textures = require('Textures');
// var Materials = require('Materials');
// var FaceTracking = require('FaceTracking');
// var Animation = require('Animation');
// var Reactive = require('Reactive');
//
// Example script
//
// Loading required modules
const Scene = require('Scene');
const FaceTracking = require('FaceTracking');
const Audio = require('Audio');
const Time = require('Time');
const Patches = require('Patches');
const Animation = require('Animation');
const Reactive = require('Reactive');
const Diagnostics = require('Diagnostics');

const eeohControllers = [
    Audio.getPlaybackController('eeoh1_controller'),
    Audio.getPlaybackController('eeoh2_controller'),
    Audio.getPlaybackController('eeoh3_controller'),
    Audio.getPlaybackController('eeoh4_controller'),
    Audio.getPlaybackController('eeoh5_controller'),
    Audio.getPlaybackController('eeoh6_controller'),
    Audio.getPlaybackController('eeoh7_controller'),
    Audio.getPlaybackController('eeoh8_controller'),
    Audio.getPlaybackController('eeoh9_controller'),
    Audio.getPlaybackController('eeoh10_controller'),
    Audio.getPlaybackController('eeoh11_controller'),
    Audio.getPlaybackController('eeoh12_controller'),
    Audio.getPlaybackController('eeoh13_controller'),
];

const crowdControllers = [
    Audio.getPlaybackController('crowd1_controller'),
    Audio.getPlaybackController('crowd2_controller'),
    Audio.getPlaybackController('crowd3_controller'),
    Audio.getPlaybackController('crowd4_controller'),
    Audio.getPlaybackController('crowd5_controller'),
    Audio.getPlaybackController('crowd6_controller'),
    Audio.getPlaybackController('crowd7_controller'),
    Audio.getPlaybackController('crowd8_controller'),
    Audio.getPlaybackController('crowd9_controller'),
    Audio.getPlaybackController('crowd10_controller'),
    Audio.getPlaybackController('crowd11_controller'),
    Audio.getPlaybackController('crowd12_controller'),
    Audio.getPlaybackController('crowd13_controller'),
];

const crowdSpeakers = [
    Scene.root.find('crowd1_speaker'),
    Scene.root.find('crowd2_speaker'),
    Scene.root.find('crowd3_speaker'),
    Scene.root.find('crowd4_speaker'),
    Scene.root.find('crowd5_speaker'),
    Scene.root.find('crowd6_speaker'),
    Scene.root.find('crowd7_speaker'),
    Scene.root.find('crowd8_speaker'),
    Scene.root.find('crowd9_speaker'),
    Scene.root.find('crowd10_speaker'),
    Scene.root.find('crowd11_speaker'),
    Scene.root.find('crowd12_speaker'),
    Scene.root.find('crowd13_speaker'),
];

const ambienceRect = Scene.root.find('ambience');
ambienceRect.material.opacity = Reactive.max(0.08, Reactive.div(FaceTracking.face(0).mouth.openness, 2.8));

const fadeSpeaker = (targetVolume, speaker, fadeTime, completion) => {
    const driver = Animation.timeDriver({durationMilliseconds: fadeTime});
    const sampler = Animation.samplers.linear(speaker.volume.lastValue, targetVolume);
    speaker.volume = Animation.animate(driver, sampler);
    
    if (completion) {
        driver.onCompleted().subscribe(completion);
    }

    driver.start();
}

const fadeOutTrigger = (speaker, controller, fadeTime) => {
    fadeSpeaker(0, speaker, fadeTime, () => {
        controller.stop();
        speaker.volume = 1.0;
    });
}

let currentEeoh = 0;
let peakVolume = 0;

let isPlaying = false;
let stopTimeout = null;
let lastStartTime = null;

FaceTracking.face(0).mouth.openness.gt(0.01).monitor().subscribe((e) => {
    if (e.newValue && !isPlaying) {
        isPlaying = true;
        peakVolume = 0;
        lastStartTime = new Date().getTime();

        eeohControllers[currentEeoh].play();
        if (currentEeoh > 0) {
            crowdControllers[currentEeoh - 1].stop();
        }
        
    } else if (!e.newValue && isPlaying) {
        stopTimeout = Time.setTimeout(() => {
            isPlaying = false;

            eeohControllers[currentEeoh].stop();

            crowdSpeakers[currentEeoh].volume = peakVolume;
            crowdControllers[currentEeoh].play();
            
            const crowdIndex = currentEeoh;
            Time.setTimeout(() => {
                fadeOutTrigger(crowdSpeakers[crowdIndex], crowdControllers[crowdIndex], 200);
            }, new Date().getTime() - lastStartTime);
            
            currentEeoh++;
            if (currentEeoh == eeohControllers.length) currentEeoh = 0;
        }, 200);
    }
});

FaceTracking.face(0).mouth.openness.monitor().subscribe((e) => {
    const volume = Math.min(Math.round(e.newValue * 100) / 100 * 2, 1);
    if (volume > peakVolume) {
        peakVolume = volume;
    }

    Patches.setScalarValue('volume', volume);
});

