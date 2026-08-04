import { useState, useEffect, useRef } from 'react';

const useBreathSensor = () => {
    const [isBlowing, setIsBlowing] = useState(false);
    const [blowIntensity, setBlowIntensity] = useState(0);
    const [isTalking, setIsTalking] = useState(false);
    const [hasMicrophoneAccess, setHasMicrophoneAccess] = useState(false);

    const audioContextRef = useRef(null);
    const analyserRef = useRef(null);
    const sourceRef = useRef(null);
    const requestRef = useRef(null);

    useEffect(() => {
        const startMicrophone = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                setHasMicrophoneAccess(true);

                audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
                analyserRef.current = audioContextRef.current.createAnalyser();
                
                // FFT ayarları
                analyserRef.current.fftSize = 2048; 
                // Üfleme bitince geminin hemen durması için tepkime süresini hızlandırdık (Varsayılan 0.8'dir, biz 0.4 yaptık)
                analyserRef.current.smoothingTimeConstant = 0.4; 

                sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
                sourceRef.current.connect(analyserRef.current);

                const bufferLength = analyserRef.current.frequencyBinCount;
                const dataArray = new Uint8Array(bufferLength);

                const analyzeAudio = () => {
                    analyserRef.current.getByteFrequencyData(dataArray);

                    // 1. SUB-BASS (0 - 85 Hz): Sadece mikrofon kapsülüne çarpan rüzgar/hava burayı tetikler (İlk 4 frekans bandı)
                    let subBassVolume = 0;
                    for (let i = 0; i < 4; i++) {
                        subBassVolume += dataArray[i];
                    }
                    const avgSubBass = subBassVolume / 4;

                    // 2. İNSAN SESİ (100 - 600 Hz): Konuşma ve bağırma burayı tetikler (5. ile 30. frekans bantları arası)
                    let voiceVolume = 0;
                    for (let i = 5; i < 30; i++) {
                        voiceVolume += dataArray[i];
                    }
                    const avgVoice = voiceVolume / 25;

                    // Kendi kendine gitmeyi önleyen KATI ALT SINIR (Oda uğultusu genelde 10-40 arasıdır)
                    const BLOW_THRESHOLD = 80; 

                    if (avgSubBass > BLOW_THRESHOLD) {
                        // KESİN ÜFLEME ŞARTI: Sub-bass, insan sesinden yüksek olmalı!
                        if (avgSubBass > avgVoice * 1.2) { 
                            setIsBlowing(true);
                            setIsTalking(false);
                            
                            // Üfleme şiddetini 0-100 arası yumuşak bir yüzdeye çevir
                            const intensity = Math.min(100, ((avgSubBass - BLOW_THRESHOLD) / (255 - BLOW_THRESHOLD)) * 100);
                            setBlowIntensity(intensity);
                        } else {
                            // Basınç var ama ses daha yüksekse (örneğin mikrofona çok yakın bağırıyorsa)
                            setIsBlowing(false);
                            setIsTalking(true);
                            setBlowIntensity(0);
                        }
                    } else {
                        // Üfleme yok ama çocuk konuşuyorsa
                        if (avgVoice > 40) {
                            setIsBlowing(false);
                            setIsTalking(true);
                            setBlowIntensity(0);
                        } else {
                            // Tamamen sessizlik
                            setIsBlowing(false);
                            setIsTalking(false);
                            setBlowIntensity(0);
                        }
                    }

                    requestRef.current = requestAnimationFrame(analyzeAudio);
                };

                analyzeAudio();

            } catch (err) {
                console.error("Mikrofon izni alınamadı:", err);
                setHasMicrophoneAccess(false);
            }
        };

        startMicrophone();

        return () => {
            cancelAnimationFrame(requestRef.current);
            if (sourceRef.current) sourceRef.current.disconnect();
            if (audioContextRef.current) audioContextRef.current.close();
        };
    }, []);

    return { isBlowing, blowIntensity, isTalking, hasMicrophoneAccess };
};

export default useBreathSensor;