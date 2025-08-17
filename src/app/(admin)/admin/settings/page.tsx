'use client';

import { useEffect, useState } from 'react';

export default function AdminSettingsPage() {
  const [storeName, setStoreName] = useState('');
  const [supportEmail, setSupportEmail] = useState('');
  const [currency, setCurrency] = useState('MMK');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('adminSettings');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.storeName) setStoreName(parsed.storeName);
        if (parsed.supportEmail) setSupportEmail(parsed.supportEmail);
        if (parsed.currency) setCurrency(parsed.currency);
      }
    } catch (e) {
      console.warn('Failed to load settings from storage', e);
    }
  }, []);

  const handleSave = () => {
    setSaving(true);
    try {
      const payload = { storeName, supportEmail, currency };
      localStorage.setItem('adminSettings', JSON.stringify(payload));
      alert('Settings saved');
    } catch (e) {
      console.error('Failed to save settings', e);
      alert('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      <form className="max-w-xl space-y-4" onSubmit={(e) => e.preventDefault()}>
        <div>
          <label className="block text-sm font-medium mb-1">Store Name</label>
          <input className="w-full rounded border px-3 py-2" placeholder="My Software Store" value={storeName} onChange={(e) => setStoreName(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Support Email</label>
          <input type="email" className="w-full rounded border px-3 py-2" placeholder="support@example.com" value={supportEmail} onChange={(e) => setSupportEmail(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Currency</label>
          <select className="w-full rounded border px-3 py-2" value={currency} onChange={(e) => setCurrency(e.target.value)}>
            <option>USD</option>
            <option>EUR</option>
            <option>GBP</option>
            <option>MMK</option>
          </select>
        </div>
        <button type="button" onClick={handleSave} disabled={saving} className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60">{saving ? 'Saving...' : 'Save'}</button>
      </form>
    </div>
  );
}