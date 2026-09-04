import React, { useState } from 'react';
import axios from 'axios';
import api from '../services/api';

const FamilyAIReport = () => {
    // Yapay zekadan gelen raporu tutacak state
    const [reportText, setReportText] = useState('');
    // Yükleniyor durumunu tutacak state (Yapay zeka düşünürken spinner göstermek için)
    const [isLoading, setIsLoading] = useState(false);
    // Hata mesajlarını tutacak state
    const [error, setError] = useState(null);

    const generateReport = async () => {
        setIsLoading(true);
        setError(null);
        setReportText('');

        try {
            // Sadece hastanın ID'sini gönderiyoruz, gerisini backend veritabanından halledecek
            //const currentUserId = localStorage.getItem('patientId') || localStorage.getItem('userId');
            const currentUserId = "67ddc38a-ce87-4838-bb90-e90050b616fa" || "96d502a1-082b-4dd9-8e45-efed9710dd0a" || "755e662b-bba0-4322-967a-fa21ced0d5c3" || "777f571e-4551-4015-9607-4ec7fe795a4b";
            const requestData = {
                userId: currentUserId
            };

            const response = await api.post('/ai/generate-report', requestData);
            setReportText(response.data);
        } catch (err) {
            console.error("Yapay Zeka API Hatası:", err);
            setError("Maalesef şu an rapor oluşturulamıyor. Lütfen backend sunucusunun çalıştığından emin olun.");
        } finally {
            setIsLoading(false);
        }
    };

    // Stiller (Projendeki tasarıma uygun şık bir görünüm)
    const cardStyle = {
        width: '600px',
        margin: '50px auto',
        padding: '30px',
        borderRadius: '20px',
        backgroundColor: '#f9f9f9',
        boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
        fontFamily: 'sans-serif',
        textAlign: 'center',
        maxHeight: '80vh',
        overflowY: 'auto'
    };

    const buttonStyle = {
        padding: '12px 30px',
        fontSize: '16px',
        backgroundColor: '#4CAF50', // Yeşil (Nefes teması)
        color: 'white',
        border: 'none',
        borderRadius: '30px',
        cursor: 'pointer',
        fontWeight: 'bold',
        transition: 'all 0.3s ease',
        boxShadow: '0 4px 10px rgba(76, 175, 80, 0.3)',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '10px'
    };

    const disabledButtonStyle = {
        ...buttonStyle,
        backgroundColor: '#a5d6a7', // Soluk yeşil (Yüklenirken)
        cursor: 'not-allowed'
    };

    const reportAreaStyle = {
        marginTop: '30px',
        padding: '20px',
        backgroundColor: 'white',
        borderRadius: '12px',
        border: '1px solid #eee',
        textAlign: 'left',
        lineHeight: '1.6',
        color: '#333'
    };

    return (
        <div style={cardStyle}>
            <h2 style={{ color: '#2E7D32', marginBottom: '10px' }}>📊 Aile Paneli: Haftalık Analiz</h2>
            <p style={{ color: '#666', marginBottom: '25px' }}>Çocuğunuzun bu haftaki gelişimini yapay zeka ile hemen analiz edin.</p>
            
            {/* 1. YAPAY ZEKA BUTONU */}
            <button 
                onClick={generateReport} 
                style={isLoading ? disabledButtonStyle : buttonStyle}
                disabled={isLoading}
            >
                {isLoading ? (
                    <>
                        {/* Basit bir CSS Spinner */}
                        <div style={{ width: '15px', height: '15px', border: '2px solid white', borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                        Yapay Zeka Düşünüyor...
                    </>
                ) : '✨ Haftalık Raporu Oluştur (AI)'}
            </button>

            {/* Hata Mesajı Alanı */}
            {error && (
                <div style={{ color: '#d32f2f', backgroundColor: '#ffcdd2', padding: '10px', borderRadius: '8px', marginTop: '20px' }}>
                    ⚠️ {error}
                </div>
            )}

            {/* 2. YAPAY ZEKA RAPOR ALANI */}
            {reportText && (
                <div style={reportAreaStyle}>
                    <h4 style={{ margin: '0 0 10px 0', color: '#1B5E20' }}>👨‍⚕️ Fizyoterapist Analizi (Gemini AI):</h4>
                    {/* Yapay zekadan gelen metindeki satır satır bölüyoruz */}
                    {reportText.split('\n').map((line, index) => (
                        <p key={index} style={{ margin: '0 0 10px 0' }}>{line}</p>
                    ))
                    }
                </div>
            )}

            {/* Spinner animasyonu için CSS */}
            <style>
                {`
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                `}
            </style>
        </div>
    );
};

export default FamilyAIReport;