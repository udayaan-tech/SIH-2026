"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { API } from './api';

const StateContext = createContext<any>(null);

export function StateProvider({ children }: { children: React.ReactNode }) {
  const [officers, setOfficers] = useState([]);
  const [currentOfficer, setCurrentOfficer] = useState(null);
  const [language, setLanguage] = useState('EN');
  const [theme, setTheme] = useState('light');
  const [fontSize, setFontSize] = useState('md');
  const [selectedCaseId, setSelectedCaseId] = useState(null);
  const [selectedDocId, setSelectedDocId] = useState(null);

  useEffect(() => {
    // Check localStorage
    const savedLang = localStorage.getItem('gov_lang');
    if (savedLang) setLanguage(savedLang);
    
    // Fetch mock officers
    const mockOfficers = [
      { officer_id: 'NDIS-IO-4102', full_name: 'A. Sharma', role_id: 'role-io', department: 'EIU' },
      { officer_id: 'NDIS-FO-8819', full_name: 'R. Patel', role_id: 'role-fo', department: 'FSD' },
      { officer_id: 'NDIS-PP-1052', full_name: 'V. Singh', role_id: 'role-lo', department: 'Legal' },
      { officer_id: 'NDIS-AUD-007', full_name: 'M. Reddy', role_id: 'role-aud', department: 'Vigilance' },
      { officer_id: 'NDIS-ADM-001', full_name: 'S. Gupta', role_id: 'role-admin', department: 'IT Sec' },
    ];
    setOfficers(mockOfficers);

    const savedId = localStorage.getItem('casevault_officer_id');
    const matched = mockOfficers.find(o => o.officer_id === savedId) || mockOfficers[0];
    setCurrentOfficer(matched);
  }, []);

  const toggleLanguage = () => {
    const newLang = language === 'EN' ? 'HI' : 'EN';
    setLanguage(newLang);
    localStorage.setItem('gov_lang', newLang);
  };

  const switchToOfficer = (officerId) => {
    const matched = officers.find(o => o.officer_id === officerId);
    if (matched) {
      setCurrentOfficer(matched);
      localStorage.setItem('casevault_officer_id', officerId);
      localStorage.setItem('casevault_token', `TOKEN-${officerId}-${Date.now()}`);
      // Refresh page to reset API headers
      window.location.reload();
    }
  };

  const applyFontSize = (size) => {
    setFontSize(size);
    if (size === 'sm') document.body.style.fontSize = '12px';
    if (size === 'md') document.body.style.fontSize = '14px';
    if (size === 'lg') document.body.style.fontSize = '18px';
  };

  const toggleHighContrast = () => {
    const newTheme = theme === 'light' ? 'high-contrast' : 'light';
    setTheme(newTheme);
    if (newTheme === 'high-contrast') {
      document.documentElement.style.setProperty('--gov-navy-primary', '#000000');
      document.documentElement.style.setProperty('--gov-surface-alt', '#1a1a1a');
      document.documentElement.style.setProperty('--gov-text-primary', '#ffffff');
      document.body.style.backgroundColor = '#000000';
      document.body.style.color = '#ffffff';
    } else {
      document.documentElement.style.removeProperty('--gov-navy-primary');
      document.documentElement.style.removeProperty('--gov-surface-alt');
      document.documentElement.style.removeProperty('--gov-text-primary');
      document.body.style.backgroundColor = '';
      document.body.style.color = '';
    }
  };

  return (
    <StateContext.Provider value={{
      officers,
      currentOfficer,
      language,
      theme,
      fontSize,
      selectedCaseId,
      selectedDocId,
      toggleLanguage,
      switchToOfficer,
      applyFontSize,
      toggleHighContrast,
      setSelectedCaseId,
      setSelectedDocId
    }}>
      {children}
    </StateContext.Provider>
  );
}

export const useAppState = () => useContext(StateContext);
