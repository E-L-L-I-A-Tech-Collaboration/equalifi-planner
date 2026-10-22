/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  HouseholdProfile, CashFlow, Debt, AssetAccount, RetirementLifestyle, 
  EducationGoal, FinancialProtection, RiskQuestionnaire, SavedPlan 
} from './types';
import { FICTIONAL_SEED_PLAN } from './utils/seedData';
import { DISCLAIMERS } from './utils/methodology';
import { auth, onAuthStateChanged, savePlanToCloud, loadPlanFromCloud, User } from './firebase';

// Import all sub-step forms
import HouseholdForm from './components/HouseholdForm';
import CashFlowForm from './components/CashFlowForm';
import DebtForm from './components/DebtForm';
import AssetsForm from './components/AssetsForm';
import RetirementForm from './components/RetirementForm';
import EducationForm from './components/EducationForm';
import ProtectionForm from './components/ProtectionForm';
import RiskForm from './components/RiskForm';
import Dashboard from './components/Dashboard';
import ScenarioComparison from './components/ScenarioComparison';
import ReportView from './components/ReportView';
import AuthModal from './components/AuthModal';
import UserMenu from './components/UserMenu';
import { PWAInstallButton } from './components/PWAInstallButton';
import { OfflineIndicator } from './components/OfflineIndicator';
import PaywallModal from './components/PaywallModal';
import { useSubscription } from './billing/useSubscription';

import { ShieldCheck, User as UserIcon, Calendar, Trash2, HelpCircle, AlertTriangle, Sparkles, RefreshCw, FileText, ChevronRight, ChevronLeft, Cloud, CloudCheck } from 'lucide-react';

const STEPS = [
  { id: 1, name: 'Household' },
  { id: 2, name: 'Cash Flow' },
  { id: 3, name: 'Debts' },
  { id: 4, name: 'Assets' },
  { id: 5, name: 'Retirement' },
  { id: 6, name: 'Education' },
  { id: 7, name: 'Protection' },
  { id: 8, name: 'Risk' },
  { id: 9, name: 'Dashboard' },
  { id: 10, name: 'Scenarios' },
  { id: 11, name: 'Report' }
];

export default function App() {
  const [activeStep, setActiveStep] = React.useState(1);

  const goToStep = React.useCallback((id: number) => {
    setActiveStep(id);
  }, []);

  // Google Play subscription (Digital Goods API). HARD GATE inside the
  // Android app: the whole planner requires an active subscription
  // (a 7-day free trial counts as active — Play reports it as a
  // purchase). On the open web the Digital Goods API does not exist,
  // status stays 'unavailable', and the planner runs ungated.
  const sub = useSubscription();
  const [paywallOpen, setPaywallOpen] = React.useState(false);

  // Core Orchestration States
  const [household, setHousehold] = React.useState<HouseholdProfile>({
    name: 'Leon',
    currentAge: 30,
    hasSpouse: false,
    spouseAge: 30,
    retirementAge: 65,
    spouseRetirementAge: 65,
    lifeExpectancy: 90,
    filingStatus: 'single',
    dependentsCount: 0,
    dependents: [],
    stateOfResidence: 'California',
    currentIncome: 80000,
    incomeGrowth: 3.0,
    marginalTaxRate: 15
  });

  const [cashFlow, setCashFlow] = React.useState<CashFlow>({
    primaryIncome: 4500,
    spouseIncome: 0,
    secondaryIncome: 0,
    housing: 1500,
    utilities: 150,
    food: 400,
    transportation: 300,
    insurance: 100,
    healthcare: 100,
    childcare: 0,
    educationExpense: 0,
    minDebtPayments: 0,
    otherRecurring: 200,
    entertainment: 400,
    retirementContributions: 400,
    nonRetirementSavings: 100
  });

  const [debts, setDebts] = React.useState<Debt[]>([]);
  const [debtMethod, setDebtMethod] = React.useState<'avalanche' | 'snowball'>('avalanche');
  const [releasedAction, setReleasedAction] = React.useState<'reinvest_percent' | 'discretionary'>('reinvest_percent');
  const [releasedReinvestPercent, setReleasedReinvestPercent] = React.useState(75);
  const [extraMonthlyBudget, setExtraMonthlyBudget] = React.useState(0);

  const [assets, setAssets] = React.useState<AssetAccount[]>([]);

  const [retirement, setRetirement] = React.useState<RetirementLifestyle>({
    incomeMethod: 'percentage',
    targetIncomePercentage: 70,
    targetIncomeCustom: 0,
    socialSecurity: 20000,
    pension: 0,
    rentalIncome: 0,
    otherIncome: 0,
    inflation: 2.5,
    retirementTax: 15,
    legacyBalance: 50000,
    healthcareReserve: 30000,
    longTermCareReserve: 0,
    withdrawalRateMethod: 'fixed_rate',
    withdrawalRate: 4.0
  });

  const [education, setEducation] = React.useState<EducationGoal[]>([]);

  const [protection, setProtection] = React.useState<FinancialProtection>({
    incomeReplacementYears: 10,
    mortgageBalance: 0,
    funeralExpenses: 15000,
    existingLifeInsurance: 0,
    availableSurvivorAssets: 5000,
    employerProvidedCoverage: 0,
    currentPremium: 0,
    hypotheticalPremium: 0,
    premiumDifferenceReturn: 6.0
  });

  const [risk, setRisk] = React.useState<RiskQuestionnaire>({
    timeHorizon: 3,
    experience: 2,
    incomeStability: 3,
    emergencyReserves: 3,
    reactionToDecline: 3,
    maxLossTolerable: 3,
    shortTermAccess: 1,
    portfolioDependence: 3,
    willingnessScore: 50,
    capacityScore: 50,
    overrideModel: false,
    selectedModelOverride: ''
  });

  // Saved scenarios state
  const [savedScenarios, setSavedScenarios] = React.useState<SavedPlan[]>([]);

  // Authentication and Cloud Sync States
  const [currentUser, setCurrentUser] = React.useState<User | null>(null);
  const [authModalOpen, setAuthModalOpen] = React.useState(false);
  const [syncStatus, setSyncStatus] = React.useState<'synced' | 'syncing' | 'error' | 'idle'>('idle');
  const [isInitialLoadDone, setIsInitialLoadDone] = React.useState(false);

  // Load state from localStorage on init
  React.useEffect(() => {
    const saved = localStorage.getItem('fin_planner_session_data');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.household) setHousehold(parsed.household);
        if (parsed.cashFlow) setCashFlow(parsed.cashFlow);
        if (parsed.debts) setDebts(parsed.debts);
        if (parsed.debtMethod) setDebtMethod(parsed.debtMethod);
        if (parsed.releasedAction) setReleasedAction(parsed.releasedAction);
        if (parsed.releasedReinvestPercent) setReleasedReinvestPercent(parsed.releasedReinvestPercent);
        if (parsed.extraMonthlyBudget) setExtraMonthlyBudget(parsed.extraMonthlyBudget);
        if (parsed.assets) setAssets(parsed.assets);
        if (parsed.retirement) setRetirement(parsed.retirement);
        if (parsed.education) setEducation(parsed.education);
        if (parsed.protection) setProtection(parsed.protection);
        if (parsed.risk) setRisk(parsed.risk);
        if (parsed.savedScenarios) setSavedScenarios(parsed.savedScenarios);
      } catch (e) {
        console.error('Error loading saved session data', e);
      }
    }
  }, []);

  // Track Firebase Auth state & cloud hydration
  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        setSyncStatus('syncing');
        try {
          const cloudData = await loadPlanFromCloud(user.uid);
          if (cloudData && cloudData.household) {
            if (cloudData.household) setHousehold(cloudData.household);
            if (cloudData.cashFlow) setCashFlow(cloudData.cashFlow);
            if (cloudData.debts) setDebts(cloudData.debts);
            if (cloudData.debtMethod) setDebtMethod(cloudData.debtMethod);
            if (cloudData.releasedAction) setReleasedAction(cloudData.releasedAction);
            if (cloudData.releasedReinvestPercent) setReleasedReinvestPercent(cloudData.releasedReinvestPercent);
            if (cloudData.extraMonthlyBudget) setExtraMonthlyBudget(cloudData.extraMonthlyBudget);
            if (cloudData.assets) setAssets(cloudData.assets);
            if (cloudData.retirement) setRetirement(cloudData.retirement);
            if (cloudData.education) setEducation(cloudData.education);
            if (cloudData.protection) setProtection(cloudData.protection);
            if (cloudData.risk) setRisk(cloudData.risk);
            if (cloudData.savedScenarios) setSavedScenarios(cloudData.savedScenarios);
          } else {
            // If new cloud account without existing plan, automatically upload current session!
            const planToMigrate = {
              household,
              cashFlow,
              debts,
              debtMethod,
              releasedAction,
              releasedReinvestPercent,
              extraMonthlyBudget,
              assets,
              retirement,
              education,
              protection,
              risk,
              savedScenarios
            };
            await savePlanToCloud(user.uid, planToMigrate);
          }
          setSyncStatus('synced');
        } catch (err) {
          console.error('Failed to sync plan on user sign in:', err);
          setSyncStatus('error');
        }
      } else {
        setSyncStatus('idle');
      }
      setIsInitialLoadDone(true);
    });

    return () => unsubscribe();
  }, []);

  // Consolidate current plan state
  const currentPlanPayload = React.useMemo(() => ({
    household,
    cashFlow,
    debts,
    debtMethod,
    releasedAction,
    releasedReinvestPercent,
    extraMonthlyBudget,
    assets,
    retirement,
    education,
    protection,
    risk,
    savedScenarios
  }), [household, cashFlow, debts, debtMethod, releasedAction, releasedReinvestPercent, extraMonthlyBudget, assets, retirement, education, protection, risk, savedScenarios]);

  // Debounced cloud & local sync
  React.useEffect(() => {
    if (!isInitialLoadDone) return;

    // Cache locally
    localStorage.setItem('fin_planner_session_data', JSON.stringify(currentPlanPayload));

    // If signed into Firebase, automatically persist to Firestore
    if (currentUser) {
      setSyncStatus('syncing');
      const timer = setTimeout(async () => {
        try {
          await savePlanToCloud(currentUser.uid, currentPlanPayload);
          setSyncStatus('synced');
        } catch (e) {
          console.error('Failed to auto-sync to cloud:', e);
          setSyncStatus('error');
        }
      }, 1200);

      return () => clearTimeout(timer);
    }
  }, [currentPlanPayload, currentUser, isInitialLoadDone]);

  // Manual immediate cloud push
  const handleManualSync = async () => {
    if (!currentUser) {
      setAuthModalOpen(true);
      return;
    }
    setSyncStatus('syncing');
    try {
      await savePlanToCloud(currentUser.uid, currentPlanPayload);
      setSyncStatus('synced');
    } catch (e) {
      console.error('Manual sync failed:', e);
      setSyncStatus('error');
    }
  };

  // Load Taylor Family demo scenario
  const handleLoadDemo = () => {
    const demo = FICTIONAL_SEED_PLAN;
    setHousehold(demo.household);
    setCashFlow(demo.cashFlow);
    setDebts(demo.debts);
    setDebtMethod(demo.debtMethod);
    setReleasedAction(demo.releasedAction);
    setReleasedReinvestPercent(demo.releasedReinvestPercent);
    setAssets(demo.assets);
    setRetirement(demo.retirement);
    setEducation(demo.education);
    setProtection(demo.protection);
    setRisk(demo.risk);
    goToStep(9); // Jump directly to dashboard for immediate results!
  };

  // Reset entire workflow back to default
  const handleResetSession = () => {
    localStorage.removeItem('fin_planner_session_data');
    window.location.reload();
  };

  // Saved plan scenario actions
  const handleSaveScenario = (name: string) => {
    const newPlan: SavedPlan = {
      id: 'plan-' + Date.now(),
      name,
      timestamp: new Date().toISOString(),
      household,
      cashFlow,
      debts,
      debtMethod,
      releasedAction,
      releasedReinvestPercent,
      assets,
      retirement,
      education,
      protection,
      risk
    };
    const updated = [...savedScenarios, newPlan];
    setSavedScenarios(updated);
  };

  const handleLoadScenario = (id: string) => {
    const plan = savedScenarios.find(s => s.id === id);
    if (plan) {
      setHousehold(plan.household);
      setCashFlow(plan.cashFlow);
      setDebts(plan.debts);
      setDebtMethod(plan.debtMethod);
      setReleasedAction(plan.releasedAction);
      setReleasedReinvestPercent(plan.releasedReinvestPercent);
      setAssets(plan.assets);
      setRetirement(plan.retirement);
      setEducation(plan.education);
      setProtection(plan.protection);
      setRisk(plan.risk);
      goToStep(9); // Jump to dashboard
    }
  };

  const handleDeleteScenario = (id: string) => {
    const updated = savedScenarios.filter(s => s.id !== id);
    setSavedScenarios(updated);
  };

  // Live sidebar overrides for instant tweaks
  const handleUpdateRetirementAge = (age: number) => {
    setHousehold({ ...household, retirementAge: age });
  };

  const handleUpdateRetirementSpending = (spending: number) => {
    setRetirement({ ...retirement, targetIncomeCustom: spending });
  };

  // Render correct active panel
  const renderStepContent = () => {
    switch (activeStep) {
      case 1:
        return <HouseholdForm data={household} onChange={setHousehold} />;
      case 2:
        return <CashFlowForm cashFlow={cashFlow} household={household} debts={debts} onChange={setCashFlow} />;
      case 3:
        return (
          <DebtForm 
            debts={debts} 
            method={debtMethod}
            releasedAction={releasedAction}
            releasedReinvestPercent={releasedReinvestPercent}
            extraMonthlyBudget={extraMonthlyBudget}
            onUpdateDebts={setDebts}
            onUpdateMethod={setDebtMethod}
            onUpdateReleasedAction={setReleasedAction}
            onUpdateReleasedPercent={setReleasedReinvestPercent}
            onUpdateExtraBudget={setExtraMonthlyBudget}
          />
        );
      case 4:
        return <AssetsForm assets={assets} household={household} onUpdateAssets={setAssets} />;
      case 5:
        return <RetirementForm retirement={retirement} household={household} onChange={setRetirement} />;
      case 6:
        return <EducationForm goals={education} onUpdateGoals={setEducation} />;
      case 7:
        return (
          <ProtectionForm 
            protection={protection} 
            household={household} 
            debts={debts} 
            education={education} 
            onChange={setProtection} 
          />
        );
      case 8:
        return <RiskForm risk={risk} onChange={setRisk} />;
      case 9:
        return (
          <Dashboard 
            household={household}
            cashFlow={cashFlow}
            debts={debts}
            debtMethod={debtMethod}
            releasedAction={releasedAction}
            releasedReinvestPercent={releasedReinvestPercent}
            extraMonthlyBudget={extraMonthlyBudget}
            assets={assets}
            education={education}
            protection={protection}
            risk={risk}
            onUpdateRetirementAge={handleUpdateRetirementAge}
            onUpdateRetirementSpending={handleUpdateRetirementSpending}
          />
        );
      case 10:
        return (
          <ScenarioComparison 
            currentPlan={{ household, cashFlow, debts, debtMethod, releasedAction, releasedReinvestPercent, assets, retirement, education, protection, risk }}
            savedScenarios={savedScenarios}
            onSaveScenario={handleSaveScenario}
            onLoadScenario={handleLoadScenario}
            onDeleteScenario={handleDeleteScenario}
          />
        );
      case 11:
        return <ReportView plan={{ household, cashFlow, debts, debtMethod, releasedAction, releasedReinvestPercent, assets, retirement, education, protection, risk }} />;
      default:
        return <HouseholdForm data={household} onChange={setHousehold} />;
    }
  };

  // Hard gate (Android app only): render no planner UI until the
  // subscription check resolves, and none at all while there is no
  // active subscription. 'premium' and 'unavailable' (open web) fall
  // through to the full planner below.
  if (sub.status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-100 via-slate-50 to-zinc-200/80 flex items-center justify-center">
        <p className="text-sm font-semibold text-zinc-500">
          Checking subscription…
        </p>
      </div>
    );
  }
  if (sub.status === 'free') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-100 via-slate-50 to-zinc-200/80">
        <PaywallModal
          isOpen
          blocking
          onClose={() => {}}
          sub={sub}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-100 via-slate-50 to-zinc-200/80 text-zinc-900 font-sans flex flex-col justify-between antialiased selection:bg-blue-200 selection:text-blue-950 relative overflow-x-hidden">
      {/* Ambient background glows to enhance glassmorphism refraction */}
      <div className="fixed -top-48 -left-48 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="fixed top-1/3 -right-48 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="fixed -bottom-48 left-1/3 w-96 h-96 bg-zinc-400/15 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Header Navigation with Frosted Glassmorphism */}
      <nav className="flex items-center justify-between px-4 sm:px-8 h-16 bg-white/70 backdrop-blur-xl border-b border-white/60 shrink-0 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] sticky top-0 z-20 print:hidden">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-tr from-blue-600 to-emerald-600 rounded-lg flex items-center justify-center text-white font-black text-sm tracking-tight shadow-xs">FI</div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <h1 className="text-lg font-black tracking-tight text-zinc-900 leading-none">
                EqualiF.I. Planner
              </h1>
              <span className="text-[10px] font-bold text-emerald-600 tracking-wide uppercase">Engine</span>
            </div>
            <span className="text-[9px] text-zinc-500 font-medium block mt-0.5">Financial Independence System</span>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="hidden xl:block text-xs text-zinc-500 font-medium">
            Status: <span className={currentUser ? "text-emerald-600 font-semibold" : "text-zinc-600 font-semibold"}>
              {currentUser ? 'Cloud Account' : 'Live Sandbox'}
            </span>
          </div>
          <button
            type="button"
            onClick={handleLoadDemo}
            className="px-3 py-1.5 bg-emerald-50/80 hover:bg-emerald-100/90 text-emerald-800 border border-emerald-300/60 rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5 backdrop-blur-xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">Load Demo Profile</span>
            <span className="sm:hidden">Demo</span>
          </button>
          <button
            type="button"
            onClick={handleResetSession}
            className="px-3 py-1.5 bg-white/70 hover:bg-white/95 text-zinc-700 border border-zinc-200/80 rounded-lg text-xs font-semibold transition-all shadow-xs cursor-pointer backdrop-blur-xs"
          >
            Reset
          </button>

          {/* Premium / Google Play subscription */}
          <button
            type="button"
            onClick={() => setPaywallOpen(true)}
            className="px-3 py-1.5 bg-amber-50/80 hover:bg-amber-100/90 text-amber-800 border border-amber-300/60 rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5 backdrop-blur-xs"
          >
            {sub.status === 'premium' ? 'Premium ✓' : 'Go Premium'}
          </button>

          {/* In-App PWA Install Prompt */}
          <PWAInstallButton />

          {/* User Account / Cloud Sync Menu */}
          <div className="pl-2 border-l border-zinc-200/60">
            <UserMenu 
              user={currentUser} 
              syncStatus={syncStatus} 
              onOpenAuth={() => setAuthModalOpen(true)}
              onManualSync={handleManualSync}
            />
          </div>
        </div>
      </nav>

      {/* Guest vs Authenticated Account Banner */}
      {currentUser ? (
        <div className="bg-emerald-500/10 text-emerald-950 text-[11px] py-1.5 px-6 border-b border-emerald-500/20 backdrop-blur-md shrink-0 print:hidden">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
              <strong>Account Connected:</strong> Signed in as <span className="font-mono text-emerald-950 font-semibold">{currentUser.email}</span>. Plans and scenarios are saved to Firebase Firestore.
            </span>
            <span className="text-[10px] text-emerald-700 font-medium hidden sm:inline">
              {syncStatus === 'syncing' ? 'Syncing changes...' : 'Cloud in sync'}
            </span>
          </div>
        </div>
      ) : (
        <div className="bg-zinc-900/5 text-zinc-700 text-[11px] py-1.5 px-6 border-b border-zinc-300/40 backdrop-blur-md shrink-0 print:hidden">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <span>🔒 <strong>Guest Session Active:</strong> Inputs are stored locally on this device. Sign in to save plans across devices.</span>
            <button
              type="button"
              onClick={() => setAuthModalOpen(true)}
              className="text-blue-600 hover:text-blue-700 font-bold hover:underline cursor-pointer flex items-center gap-1 ml-2"
            >
              Sign In / Create Account →
            </button>
          </div>
        </div>
      )}

      {/* Main Body with Sidebar Progress */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-[calc(100vh-6rem)]">
        
        {/* Sidebar Progress Glass Panel */}
        <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r border-white/50 bg-white/50 backdrop-blur-xl flex flex-col shrink-0 print:hidden shadow-[4px_0_24px_-4px_rgba(0,0,0,0.02)]">
          <div className="p-6 border-b border-zinc-200/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Progress</span>
              <span className="text-xs font-bold text-blue-600 font-mono">{Math.round((activeStep / STEPS.length) * 100)}%</span>
            </div>
            <div className="w-full bg-zinc-200/80 h-1.5 rounded-full overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-emerald-600 h-1.5 rounded-full transition-all duration-300" style={{ width: `${Math.round((activeStep / STEPS.length) * 100)}%` }}></div>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 max-h-[320px] md:max-h-none">
            <ul className="space-y-1">
              {STEPS.map((step) => {
                const isCompleted = step.id < activeStep;
                const isActive = step.id === activeStep;
                return (
                  <li key={step.id}>
                    <button
                      type="button"
                      onClick={() => goToStep(step.id)}
                      className={`w-full flex items-center gap-3 p-2 rounded-lg text-sm transition-all text-left cursor-pointer ${
                        isActive 
                          ? 'text-zinc-900 font-bold bg-blue-50/80 border-l-4 border-blue-600 pl-2 shadow-xs backdrop-blur-xs' 
                          : isCompleted 
                            ? 'text-zinc-700 hover:text-zinc-900 hover:bg-white/60' 
                            : 'text-zinc-400 hover:text-zinc-600 hover:bg-white/30'
                      }`}
                    >
                      {isCompleted ? (
                        <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[10px] font-bold shrink-0">✓</div>
                      ) : (
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center text-[10px] shrink-0 ${
                          isActive ? 'border-blue-600 bg-blue-600 text-white font-bold' : 'border-zinc-300 text-zinc-400'
                        }`}>
                          {step.id}
                        </div>
                      )}
                      <span className="truncate">{step.name}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
          
          <div className="p-4 border-t border-zinc-200/50 text-[10px] leading-tight text-zinc-500 flex items-center gap-1.5">
            {currentUser ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0"></span>
                <span className="truncate">Persistent Cloud Database</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-zinc-400 shrink-0"></span>
                <span>Guest Mode (Browser Cache)</span>
              </>
            )}
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-8 overflow-y-auto">
          <div className="max-w-5xl mx-auto space-y-6">
            
            {/* Step Panel Content with Frosted Glassmorphic Canvas */}
            <div className="glass-panel p-5 sm:p-8 rounded-2xl">
              {renderStepContent()}
            </div>

            {/* Prev / Next buttons */}
            <div className="flex justify-between items-center pt-2 print:hidden">
              <button
                type="button"
                disabled={activeStep === 1}
                onClick={() => setActiveStep(prev => prev - 1)}
                className={`inline-flex items-center gap-1 px-4 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                  activeStep === 1 
                    ? 'opacity-40 cursor-not-allowed bg-zinc-100 text-zinc-400 border-zinc-200' 
                    : 'bg-white/70 hover:bg-white/95 text-zinc-700 border-zinc-300/80 hover:border-zinc-400 backdrop-blur-xs shadow-xs'
                }`}
              >
                <ChevronLeft className="w-4 h-4" />
                Previous Step
              </button>

              <div className="text-xs text-zinc-500 font-medium">
                Step {activeStep} of {STEPS.length}
              </div>

              <button
                type="button"
                disabled={activeStep === STEPS.length}
                onClick={() => goToStep(activeStep + 1)}
                className={`inline-flex items-center gap-1 px-5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  activeStep === STEPS.length 
                    ? 'opacity-40 cursor-not-allowed bg-zinc-100 text-zinc-400 border border-zinc-200' 
                    : 'bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white shadow-sm'
                }`}
              >
                Next Step
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Bottom Disclaimer Container with subtle glass effect */}
            <div className="glass-panel-subtle rounded-xl p-5 print:hidden">
              <p className="text-[10px] leading-relaxed text-zinc-600 italic">
                <strong>Disclosures:</strong> This application provides educational financial projections based on user-provided information and selected assumptions. Results are estimates, not guarantees. This application does not provide individualized investment, tax, legal, insurance, or retirement advice. Investment returns vary, and loss of principal is possible. Insurance replacement can create financial, tax, and coverage risks. Do not cancel an existing policy before replacement coverage is approved and active. Consult appropriately licensed financial, tax, legal, and insurance professionals before making financial decisions.
              </p>
            </div>

          </div>
        </main>
      </div>

      {/* Bottom Status Bar */}
      <footer className="h-8 bg-white/60 backdrop-blur-xl border-t border-white/50 px-6 flex items-center justify-between shrink-0 text-[10px] text-zinc-500 font-medium print:hidden">
        <div className="flex gap-4 items-center">
          <span>{currentUser ? `Account: ${currentUser.email} (Cloud Synced)` : 'Session: Guest (Local Storage)'}</span>
          <span>•</span>
          <span>Database: Firebase Firestore</span>
          <span>•</span>
          <span>Methodology: V2.4.0</span>
        </div>
        <div className="hidden sm:block">
          © {new Date().getFullYear()} EqualiF.I. Planner | Financial Independence Planning & Analysis Engine
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={(user) => {
          setCurrentUser(user);
        }}
      />


      {/* Google Play Premium Paywall (info/purchase sheet; the hard
          gate for unsubscribed Android users renders earlier) */}
      <PaywallModal
        isOpen={paywallOpen}
        onClose={() => setPaywallOpen(false)}
        sub={sub}
      />

      {/* Offline Connectivity Banner */}
      <OfflineIndicator />

    </div>
  );
}
