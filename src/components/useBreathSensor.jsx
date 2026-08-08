import { useState, useRef, useCallback } from 'react';

const useBreathSensor = () => {
  const [blowIntensity, setBlowIntensity] = useState(0);
  const [isListening, setIsListening] = useState(false);
  
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceRef = useRef(null);
  const animationFrameRef = useRef(null);

  const startListening = async () => {
    try {
      // Tarayıcıdan mikrofon izni iste
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Ses analizcisini (AudioContext) başlat
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      
      // FFT ayarları (Üfleme sesine hassaslaştırmak için)
      analyserRef.current.fftSize = 2048;
      analyserRef.current.smoothingTimeConstant = 0.4; // Tepkimeyi hızlandırır
      
      sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
      sourceRef.current.connect(analyserRef.current);
      
      setIsListening(true);
      analyzeAudio();
    } catch (error) {
      console.error("Mikrofon izni alınamadı:", error);
      alert("Oyunu oynamak için tarayıcıdan mikrofon izni vermeniz gerekiyor!");
    }
  };

  const analyzeAudio = () => {
    if (!analyserRef.current) return;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    analyserRef.current.getByteFrequencyData(dataArray);
    
    // Nefes ve üfleme sesleri genellikle düşük frekanslardadır
    // İlk 30 frekans bandını toplayarak üfleme şiddetini (blowIntensity) hesaplıyoruz
    let sum = 0;
    for (let i = 0; i < 30; i++) {
      sum += dataArray[i];
    }
    
    let average = sum / 30;
    setBlowIntensity(average);

    // Döngüyü devam ettir
    animationFrameRef.current = requestAnimationFrame(analyzeAudio);
  };

  const stopListening = useCallback(() => {
    // Tüm ses ve animasyon döngülerini temizle
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
    }
    if (sourceRef.current && sourceRef.current.mediaStream) {
      sourceRef.current.mediaStream.getTracks().forEach(track => track.stop());
    }
    
    setIsListening(false);
    setBlowIntensity(0);
  }, []);

  return { blowIntensity, isListening, startListening, stopListening };
};

export default useBreathSensor;