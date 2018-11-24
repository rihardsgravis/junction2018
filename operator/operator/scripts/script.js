const Diagnostics = require('Diagnostics');
const Animation = require('Animation');
const Audio = require('Audio');
const CameraInfo = require('CameraInfo');
const FaceTracking = require('FaceTracking');
const Reactive = require('Reactive');
const Scene = require('Scene');
const Time = require('Time');
const Patches = require('Patches');

const log = (text) => Diagnostics.log(text);

const getTrack = (title) => {
    return {
        sound: Audio.getPlaybackController(`${title}Track`),
        speaker: Scene.root.find(`${title}Speaker`),
        oldValue: 0,
    };
};

const eyes = {
    right: false,
    left: false,
    effect: ``,
};

const tracks = {
    mouth: getTrack('mouth'),
    mouthCrazy: getTrack('mouthCrazy'),
    leftEye: getTrack('leftEye'),
    rightEye: getTrack('rightEye'),
};

const init = () => {
    mouth();
    leftEye(tracks.leftEye);
    rightEye(tracks.rightEye);

    Diagnostics.log('YE');
};

const mouth = () => {
    const MULTIPLIER = 2.5;

    tracks.mouth.sound.loop();
    tracks.mouthCrazy.sound.loop();

    const signal = FaceTracking.face(0).mouth.openness.monitor();

    signal.subscribe((e) => {
        const volume = Math.min(Math.round(e.newValue * 100) / 100 * MULTIPLIER, 1);

        if (volume !== tracks.mouth.oldValue) {
            Patches.setScalarValue(`mouth${eyes.effect ? 'Crazy' : ''}Track`, volume);
            tracks.mouth.oldValue = volume;
        }
    });
};

const leftEye = (track) => {
    FaceTracking.face(0).leftEye.openness.le(0.2).monitor().subscribe(() => {
        if (eyes.left) {
            return;
        }
        eyes.left = true;
        track.sound.play();

        if (eyes.right && !eyes.effect) {
            eyes.effect = true;
            Patches.setScalarValue(`mouthTrack`, 0);
            Patches.setScalarValue(`mouthCrazyTrack`, tracks.mouth.oldValue);
        }
    });

    FaceTracking.face(0).leftEye.openness.gt(0.45).monitor().subscribe(() => {
        if (!eyes.left) {
            return;
        }
        eyes.left = false;

        if (eyes.effect) {
            eyes.effect = false;
            Patches.setScalarValue(`mouthCrazyTrack`, 0);
            Patches.setScalarValue(`mouthTrack`, tracks.mouthCrazy.oldValue);
        }
    });
};

const rightEye = (track) => {
    FaceTracking.face(0).rightEye.openness.le(0.2).monitor().subscribe(() => {
        if (eyes.right) {
            return;
        }
        eyes.right = true;
        track.sound.play();

        if (eyes.left && !eyes.effect) {
            eyes.effect = true;
            Patches.setScalarValue(`mouthTrack`, 0);
            Patches.setScalarValue(`mouthCrazyTrack`, tracks.mouth.oldValue);
        }
    });

    FaceTracking.face(0).rightEye.openness.gt(0.45).monitor().subscribe(() => {
        if (!eyes.right) {
            return;
        }
        eyes.right = false;

        if (eyes.effect) {
            eyes.effect = false;
            Patches.setScalarValue(`mouthCrazyTrack`, 0);
            Patches.setScalarValue(`mouthTrack`, tracks.mouthCrazy.oldValue);
        }
    });
};

init();
