import { useState, useMemo, useEffect } from 'react';
import { useBetStore } from '../../store/betStore';
import Modal from './Modal';
import { validateBetInput } from '../../utils/utils';
import { MARKET_TYPES } from '../../types/types';
import type { MarketType, MatchFormat } from '../../types/types';
import { UploadCloud, FileImage, Sparkles, Cpu, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';

interface PresetSlip {
  name: string;
  bookmaker: string;
  matchId: string;
  matchTitle: string;
  marketType: MarketType;
  selection: string;
  stake: number;
  odds: number;
  confidence: number;
  isCorrupt?: boolean;
}

export default function ImportSlipModal() {
  const isOpen = useBetStore((s) => s.modals.importSlip);
  const closeModal = useBetStore((s) => s.closeModal);
  const matches = useBetStore((s) => s.matches);
  const bankrolls = useBetStore((s) => s.bankrolls);
  const addBet = useBetStore((s) => s.addBet);

  // States
  const [step, setStep] = useState<'upload' | 'scanning' | 'preview' | 'fallback'>('upload');
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [confidence, setConfidence] = useState(100);
  const [error, setError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  // Form states for preview
  const [formData, setFormData] = useState({
    matchId: '',
    bookmaker: '',
    marketType: 'Match Winner' as MarketType,
    selection: '',
    stake: '',
    odds: '',
    bankrollId: '',
  });

  const activeMatches = useMemo(
    () => matches.filter((m) => m.status !== 'finished'),
    [matches],
  );

  // Preset templates representing Indian bookmaker-style screenshots
  const presets: PresetSlip[] = useMemo(() => {
    // Find active match IDs if possible
    const cskMatch = matches.find((m) => m.team1.shortName === 'CSK' || m.team2.shortName === 'CSK') || matches[0];
    const rcbMatch = matches.find((m) => m.team1.shortName === 'RCB' || m.team2.shortName === 'RCB') || matches[1] || matches[0];
    const engMatch = matches.find((m) => m.team1.shortName === 'ENG' || m.team2.shortName === 'ENG') || matches[2] || matches[0];

    return [
      {
        name: 'Dream11 Slip (CSK Winner bet)',
        bookmaker: 'Dream11',
        matchId: cskMatch?.id || 'match-1',
        matchTitle: cskMatch ? `${cskMatch.team1.shortName} vs ${cskMatch.team2.shortName}` : 'CSK vs MI',
        marketType: 'Match Winner',
        selection: 'Chennai Super Kings',
        stake: 5000,
        odds: 1.85,
        confidence: 98,
      },
      {
        name: '1xBet Slip (Virat Kohli Top Batter)',
        bookmaker: '1xBet',
        matchId: rcbMatch?.id || 'match-2',
        matchTitle: rcbMatch ? `${rcbMatch.team1.shortName} vs ${rcbMatch.team2.shortName}` : 'RCB vs KKR',
        marketType: 'Top Batter',
        selection: 'Virat Kohli',
        stake: 2500,
        odds: 3.40,
        confidence: 94,
      },
      {
        name: 'Parimatch Slip (ENG Session Over 7.5 Runs)',
        bookmaker: 'Parimatch',
        matchId: engMatch?.id || 'match-3',
        matchTitle: engMatch ? `${engMatch.team1.shortName} vs ${engMatch.team2.shortName}` : 'ENG vs SA',
        marketType: 'Session Betting',
        selection: 'Next Over Runs - Over 7.5',
        stake: 10000,
        odds: 1.90,
        confidence: 91,
      },
      {
        name: 'Corrupted Slip (Fails OCR)',
        bookmaker: '',
        matchId: '',
        matchTitle: '',
        marketType: 'Match Winner',
        selection: '',
        stake: 0,
        odds: 0,
        confidence: 0,
        isCorrupt: true,
      },
    ];
  }, [matches]);

  // Simulate scanning/parsing OCR
  const runOCR = (slip: PresetSlip) => {
    setStep('scanning');
    setError('');

    let progress = 0;
    const phrases = [
      'Locating slip boundaries...',
      'Recognizing bookmaker template...',
      'Extracting odds & stakes...',
      'Matching selections against database...',
      'Formulating confidence matrix...',
    ];

    setStatusMessage(phrases[0]);

    const interval = setInterval(() => {
      progress++;
      if (progress < phrases.length) {
        setStatusMessage(phrases[progress]);
      } else {
        clearInterval(interval);
        
        // Settle OCR outcome
        if (slip.isCorrupt) {
          setStep('fallback');
          setError('OCR scan failed: The uploaded screenshot details could not be matched. Please fill in the details manually.');
          setFormData({
            matchId: '',
            bookmaker: '',
            marketType: 'Match Winner',
            selection: '',
            stake: '',
            odds: '',
            bankrollId: '',
          });
        } else {
          setConfidence(slip.confidence);
          setFormData({
            matchId: slip.matchId,
            bookmaker: slip.bookmaker,
            marketType: slip.marketType,
            selection: slip.selection,
            stake: slip.stake.toString(),
            odds: slip.odds.toString(),
            bankrollId: bankrolls[0]?.id || '',
          });
          setStep('preview');
        }
      }
    }, 350);
  };

  // Drag and drop event handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      handleFileSelected(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelected(e.target.files[0]);
    }
  };

  const handleFileSelected = (file: File) => {
    setSelectedFile(file);
    const fname = file.name.toLowerCase();

    // Map keywords to simulate OCR for uploaded screenshots
    if (fname.includes('1x') || fname.includes('kohli') || fname.includes('rcb') || fname.includes('batter')) {
      runOCR(presets[1]);
    } else if (fname.includes('pari') || fname.includes('session') || fname.includes('eng')) {
      runOCR(presets[2]);
    } else if (fname.includes('corrupt') || fname.includes('fail') || fname.includes('bad') || fname.includes('unreadable')) {
      runOCR(presets[3]);
    } else {
      // Default to Preset 1 (Dream11)
      runOCR(presets[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const match = matches.find((m) => m.id === formData.matchId);
    if (!match || !formData.bankrollId) {
      setError('Please select a valid match and target bankroll.');
      return;
    }

    const stakeNum = parseFloat(formData.stake);
    const oddsNum = parseFloat(formData.odds);
    const bankroll = bankrolls.find((b) => b.id === formData.bankrollId);

    const validationError = validateBetInput(
      stakeNum,
      oddsNum,
      formData.selection,
      bankroll?.balance ?? 0,
    );
    if (validationError) {
      setError(validationError);
      return;
    }

    // Save into history
    addBet({
      matchId: formData.matchId,
      matchTitle: `${match.team1.shortName} vs ${match.team2.shortName}`,
      tournament: match.tournament,
      format: match.format as MatchFormat,
      marketType: formData.marketType,
      selection: formData.selection.trim(),
      stake: stakeNum,
      odds: oddsNum,
      timePlaced: new Date().toISOString(),
      status: 'running',
      profitLoss: 0,
      bankrollId: formData.bankrollId,
      stage: 'league',
    });

    handleClose();
  };

  const handleClose = () => {
    setStep('upload');
    setSelectedFile(null);
    setError('');
    closeModal('importSlip');
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Import Bet Slip Screenshot">
      {step === 'upload' && (
        <div className="space-y-4">
          <div className="text-center text-xs text-muted mb-2">
            Import bets instantly from Dream11, 1xBet, or Parimatch screenshots.
          </div>

          {/* Drag & Drop Area */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-all flex flex-col items-center justify-center cursor-pointer ${
              dragOver ? 'border-gold bg-gold/[0.04]' : 'border-white/[0.08] hover:border-white/20'
            }`}
            onClick={() => document.getElementById('slip-picker')?.click()}
          >
            <UploadCloud className="w-10 h-10 text-gold mb-3 animate-bounce-soft" />
            <p className="text-xs font-bold text-white/90">Drag & drop slip screenshot here</p>
            <p className="text-[10px] text-dim mt-1.5">or click to browse local files</p>
            
            <input
              id="slip-picker"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {/* Preset Buttons for easy testing */}
          <div className="pt-2 border-t border-white/[0.04]">
            <p className="text-[10px] text-dim uppercase font-bold tracking-wider mb-2.5">
              Or scan a preset Indian Bookmaker slip
            </p>
            <div className="grid grid-cols-2 gap-2">
              {presets.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => runOCR(preset)}
                  className={`p-2.5 rounded-lg border text-left text-xs transition-all flex items-center justify-between hover:bg-white/[0.03] ${
                    preset.isCorrupt
                      ? 'border-loss/20 hover:border-loss/40 text-loss'
                      : 'border-white/[0.05] hover:border-white/20 text-white/80'
                  }`}
                >
                  <span className="truncate pr-2 font-semibold">{preset.name}</span>
                  {preset.isCorrupt ? (
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-loss/80" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5 shrink-0 text-gold/80" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {step === 'scanning' && (
        <div className="py-12 flex flex-col items-center justify-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border border-white/[0.05] flex items-center justify-center">
              <Cpu className="w-8 h-8 text-gold animate-pulse-soft" />
            </div>
            <Loader2 className="w-20 h-20 text-gold animate-spin absolute -top-2 -left-2 opacity-60" />
          </div>
          <p className="text-xs font-bold text-gold animate-pulse">Running AI OCR Scan...</p>
          <p className="text-[10px] text-dim text-center">{statusMessage}</p>
        </div>
      )}

      {step === 'preview' && (
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[80vh] overflow-y-auto pr-1 hide-scrollbar">
          {/* Confidence Indicator */}
          <div className="bg-profit/[0.06] border border-profit/20 rounded-xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-profit" />
              <div>
                <p className="text-xs font-bold text-white/95">Scan Completed Successfully</p>
                <p className="text-[10px] text-dim mt-0.5">Details extracted from Indian slip</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-dim block font-bold uppercase">Confidence</span>
              <span className="text-base font-extrabold text-profit">{confidence}%</span>
            </div>
          </div>

          <div className="space-y-3.5">
            {/* Bookmaker */}
            <div>
              <label className="text-[10px] text-dim uppercase tracking-wider font-bold block mb-1">
                Detected Bookmaker
              </label>
              <input
                type="text"
                className="input-dark"
                value={formData.bookmaker}
                onChange={(e) => setFormData({ ...formData, bookmaker: e.target.value })}
                placeholder="e.g. Dream11"
                required
              />
            </div>

            {/* Match select */}
            <div>
              <label className="text-[10px] text-dim uppercase tracking-wider font-bold block mb-1">
                Match
              </label>
              <select
                className="select-dark"
                value={formData.matchId}
                onChange={(e) => setFormData({ ...formData, matchId: e.target.value })}
                required
              >
                <option value="">Select match</option>
                {activeMatches.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.team1.shortName} vs {m.team2.shortName} – {m.tournament}
                  </option>
                ))}
              </select>
            </div>

            {/* Market Type */}
            <div>
              <label className="text-[10px] text-dim uppercase tracking-wider font-bold block mb-1">
                Market Type
              </label>
              <select
                className="select-dark"
                value={formData.marketType}
                onChange={(e) => setFormData({ ...formData, marketType: e.target.value as MarketType })}
                required
              >
                {MARKET_TYPES.map((mt) => (
                  <option key={mt} value={mt}>
                    {mt}
                  </option>
                ))}
              </select>
            </div>

            {/* Selection */}
            <div>
              <label className="text-[10px] text-dim uppercase tracking-wider font-bold block mb-1">
                Selection
              </label>
              <input
                type="text"
                className="input-dark"
                value={formData.selection}
                onChange={(e) => setFormData({ ...formData, selection: e.target.value })}
                placeholder="e.g. Chennai Super Kings"
                required
              />
            </div>

            {/* Stake and Odds */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-dim uppercase tracking-wider font-bold block mb-1">
                  Stake (₹)
                </label>
                <input
                  type="number"
                  className="input-dark"
                  value={formData.stake}
                  onChange={(e) => setFormData({ ...formData, stake: e.target.value })}
                  placeholder="5000"
                  required
                />
              </div>
              <div>
                <label className="text-[10px] text-dim uppercase tracking-wider font-bold block mb-1">
                  Odds
                </label>
                <input
                  type="number"
                  className="input-dark"
                  step="0.01"
                  value={formData.odds}
                  onChange={(e) => setFormData({ ...formData, odds: e.target.value })}
                  placeholder="1.85"
                  required
                />
              </div>
            </div>

            {/* Target Bankroll */}
            <div>
              <label className="text-[10px] text-dim uppercase tracking-wider font-bold block mb-1">
                Target Bankroll
              </label>
              <select
                className="select-dark"
                value={formData.bankrollId}
                onChange={(e) => setFormData({ ...formData, bankrollId: e.target.value })}
                required
              >
                <option value="">Select bankroll</option>
                {bankrolls.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} – ₹{b.balance.toLocaleString('en-IN')}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {error && (
            <p className="text-xs text-loss font-semibold bg-loss/[0.06] border border-loss/20 rounded-lg p-2.5">
              {error}
            </p>
          )}

          <div className="flex gap-2 pt-2 border-t border-white/[0.04]">
            <button
              type="button"
              onClick={() => setStep('upload')}
              className="flex-1 py-3 rounded-xl bg-white/[0.05] border border-white/[0.05] text-xs font-bold text-muted hover:bg-white/[0.1] hover:text-white transition-colors"
            >
              Scan Different Slip
            </button>
            <button
              type="submit"
              className="flex-1 py-3 rounded-xl gradient-gold text-dark font-extrabold text-xs hover:opacity-90 transition-opacity glow-gold"
            >
              Confirm & Save Bet
            </button>
          </div>
        </form>
      )}

      {step === 'fallback' && (
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[80vh] overflow-y-auto pr-1 hide-scrollbar">
          {/* Error Message */}
          <div className="bg-loss/[0.06] border border-loss/20 rounded-xl p-3 flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-loss shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-white/95">Screenshot Unreadable</p>
              <p className="text-[10px] text-dim mt-0.5 leading-snug">
                The image didn't match known bookmaker slip templates. Please enter details manually below.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {/* Match Select */}
            <div>
              <label className="text-[10px] text-dim uppercase block mb-1 font-bold">Match</label>
              <select
                className="select-dark"
                value={formData.matchId}
                onChange={(e) => setFormData({ ...formData, matchId: e.target.value })}
                required
              >
                <option value="">Select match</option>
                {activeMatches.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.team1.shortName} vs {m.team2.shortName} – {m.tournament}
                  </option>
                ))}
              </select>
            </div>

            {/* Selection */}
            <div>
              <label className="text-[10px] text-dim uppercase block mb-1 font-bold">Selection</label>
              <input
                type="text"
                className="input-dark"
                placeholder="e.g. Mumbai Indians"
                value={formData.selection}
                onChange={(e) => setFormData({ ...formData, selection: e.target.value })}
                required
              />
            </div>

            {/* Stake & Odds */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-dim uppercase block mb-1 font-bold">Stake (₹)</label>
                <input
                  type="number"
                  className="input-dark"
                  placeholder="5000"
                  value={formData.stake}
                  onChange={(e) => setFormData({ ...formData, stake: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="text-[10px] text-dim uppercase block mb-1 font-bold">Odds</label>
                <input
                  type="number"
                  className="input-dark"
                  placeholder="1.85"
                  step="0.01"
                  value={formData.odds}
                  onChange={(e) => setFormData({ ...formData, odds: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* Target Bankroll */}
            <div>
              <label className="text-[10px] text-dim uppercase block mb-1 font-bold">Target Bankroll</label>
              <select
                className="select-dark"
                value={formData.bankrollId}
                onChange={(e) => setFormData({ ...formData, bankrollId: e.target.value })}
                required
              >
                <option value="">Select bankroll</option>
                {bankrolls.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} – ₹{b.balance.toLocaleString('en-IN')}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-2 pt-2 border-t border-white/[0.04]">
            <button
              type="button"
              onClick={() => setStep('upload')}
              className="flex-1 py-3 rounded-xl bg-white/[0.05] border border-white/[0.05] text-xs font-bold text-muted hover:bg-white/[0.1] hover:text-white transition-colors"
            >
              Try Uploading Again
            </button>
            <button
              type="submit"
              className="flex-1 py-3 rounded-xl gradient-gold text-dark font-extrabold text-xs hover:opacity-90 transition-opacity glow-gold"
            >
              Add Bet Manually
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
