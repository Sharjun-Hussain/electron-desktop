import { useSettings } from "@/app/hooks/swr/useSettings";
import { useCallback } from "react";

// Shared AudioContext to prevent "delayed playback" and autoplay blocking issues
let globalAudioContext = null;

export const useBeep = () => {
    const { useModularSettings } = useSettings();
    const { data: response } = useModularSettings('pos');
    const posSettings = response?.data || {};

    const playBeep = useCallback(async (type = 'default', overrides = {}) => {
        const config = {
            enableSound: posSettings.enableSound ?? true,
            masterVolume: posSettings.masterVolume ?? 60,
            beepPitch: posSettings.beepPitch ?? 440,
            beepWaveform: posSettings.beepWaveform || 'sine',
            beepDuration: posSettings.beepDuration ?? 0.1,
            ...overrides
        };

        if (!config.enableSound) return;

        try {
            // Initialize or Resume the global context
            if (!globalAudioContext) {
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                globalAudioContext = new AudioContext();
            }

            if (globalAudioContext.state === 'suspended') {
                await globalAudioContext.resume();
            }

            const oscillator = globalAudioContext.createOscillator();
            const gainNode = globalAudioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(globalAudioContext.destination);

            // Dynamic Tone Strategy
            let frequency = config.beepPitch;
            let duration = config.beepDuration;
            let waveType = config.beepWaveform;
            let volume = config.masterVolume / 1000;

            if (type === 'error') {
                frequency = config.beepPitch * 0.5;
                duration = config.beepDuration * 3;
                waveType = 'square';
                volume *= 1.4;
            } else if (type === 'success') {
                frequency = config.beepPitch * 1.5;
                duration = config.beepDuration * 1.2;
                waveType = 'sine';
            } else if (type === 'scan') {
                frequency = config.beepPitch * 1.8;
                duration = 0.04;
                waveType = 'sine';
                volume *= 0.8;
            }

            oscillator.type = waveType;
            oscillator.frequency.setValueAtTime(frequency, globalAudioContext.currentTime);

            gainNode.gain.setValueAtTime(volume, globalAudioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.00001, globalAudioContext.currentTime + duration);

            oscillator.start();
            oscillator.stop(globalAudioContext.currentTime + duration);

        } catch (error) {
            console.warn("Synthesis Engine Execution Failed:", error);
        }
    }, [posSettings]);

    return { playBeep };
};
