import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";

const STEPS = {
  ROLE: "role",
  CREATOR_TYPE: "creator_type",
  EXPERIENCE: "experience",
  PREFERENCES: "preferences",
  NOTIFICATIONS: "notifications",
  REVIEW: "review",
};

const defaultData = {
  role: "",
  creatorType: [],
  experience: "beginner",
  chains: ["Polygon"],
  categories: [],
  notifications: false,
};

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(STEPS.ROLE);
  const [data, setData] = useState(defaultData);

  useEffect(() => {
    const saved = localStorage.getItem("durchex_onboarding");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setData({ ...defaultData, ...parsed });
      } catch {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("durchex_onboarding", JSON.stringify(data));
  }, [data]);

  const isCreator = useMemo(() => data.role === "creator" || data.role === "both", [data.role]);

  const next = () => {
    if (step === STEPS.ROLE) {
      setStep(isCreator ? STEPS.CREATOR_TYPE : STEPS.EXPERIENCE);
      return;
    }
    if (step === STEPS.CREATOR_TYPE) {
      setStep(STEPS.EXPERIENCE);
      return;
    }
    if (step === STEPS.EXPERIENCE) {
      setStep(STEPS.PREFERENCES);
      return;
    }
    if (step === STEPS.PREFERENCES) {
      setStep(STEPS.NOTIFICATIONS);
      return;
    }
    if (step === STEPS.NOTIFICATIONS) {
      setStep(STEPS.REVIEW);
      return;
    }
  };

  const back = () => {
    if (step === STEPS.REVIEW) return setStep(STEPS.NOTIFICATIONS);
    if (step === STEPS.NOTIFICATIONS) return setStep(STEPS.PREFERENCES);
    if (step === STEPS.PREFERENCES) return setStep(STEPS.EXPERIENCE);
    if (step === STEPS.EXPERIENCE) return setStep(isCreator ? STEPS.CREATOR_TYPE : STEPS.ROLE);
    if (step === STEPS.CREATOR_TYPE) return setStep(STEPS.ROLE);
  };

  const finish = () => {
    localStorage.setItem("durchex_onboarding_completed", "true");
    localStorage.setItem("durchex_onboarding", JSON.stringify(data));
    if (data.role === "creator") navigate("/studio");
    else if (data.role === "collector") navigate("/explore");
    else navigate("/");
  };

  const toggleArray = (key, value) => {
    setData((prev) => {
      const exists = prev[key].includes(value);
      return { ...prev, [key]: exists ? prev[key].filter((v) => v !== value) : [...prev[key], value] };
    });
  };

  const Section = ({ title, subtitle, children }) => (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold text-white">{title}</h1>
        {subtitle && <p className="text-gray-400 mt-1">{subtitle}</p>}
      </div>
      <div className="bg-gray-900/70 border border-gray-800 rounded-xl p-6">{children}</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
      <Header />

      {step === STEPS.ROLE && (
        <Section title="Welcome to DURCHEX" subtitle="Tell us how you plan to use the marketplace.">
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { id: "creator", label: "Creator", desc: "Mint and manage your collections" },
              { id: "collector", label: "Collector", desc: "Discover and trade NFTs" },
              { id: "both", label: "Both", desc: "I do a bit of everything" },
            ].map((opt) => (
              <button
                key={opt.id}
                onClick={() => setData((p) => ({ ...p, role: opt.id }))}
                className={`text-left p-5 rounded-xl border transition-colors ${
                  data.role === opt.id ? "border-blue-500 bg-blue-500/10" : "border-gray-800 hover:border-gray-700"
                }`}
              >
                <div className="font-display text-xl mb-1">{opt.label}</div>
                <div className="text-gray-400 text-sm">{opt.desc}</div>
              </button>
            ))}
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button disabled={!data.role} onClick={next} className="px-5 py-2 rounded-lg bg-blue-600 disabled:opacity-50">
              Continue
            </button>
          </div>
        </Section>
      )}

      {step === STEPS.CREATOR_TYPE && (
        <Section title="What will you create?" subtitle="Select all that apply.">
          <div className="grid gap-3 md:grid-cols-3">
            {[
              "Art",
              "PFP / Collections",
              "Music",
              "Gaming Assets",
              "Tickets / Access",
              "Photography",
            ].map((c) => (
              <button
                key={c}
                onClick={() => toggleArray("creatorType", c)}
                className={`text-left p-4 rounded-lg border transition-colors ${
                  data.creatorType.includes(c) ? "border-blue-500 bg-blue-500/10" : "border-gray-800 hover:border-gray-700"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
          <div className="flex justify-between gap-3 mt-6">
            <button onClick={back} className="px-5 py-2 rounded-lg bg-gray-800">Back</button>
            <button onClick={next} className="px-5 py-2 rounded-lg bg-blue-600">Continue</button>
          </div>
        </Section>
      )}

      {step === STEPS.EXPERIENCE && (
        <Section title="Your experience" subtitle="This helps us tailor tips and defaults.">
          <div className="grid gap-3 md:grid-cols-3">
            {["beginner", "intermediate", "advanced"].map((lvl) => (
              <button
                key={lvl}
                onClick={() => setData((p) => ({ ...p, experience: lvl }))}
                className={`text-left p-4 rounded-lg border capitalize ${
                  data.experience === lvl ? "border-blue-500 bg-blue-500/10" : "border-gray-800 hover:border-gray-700"
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
          <div className="flex justify-between gap-3 mt-6">
            <button onClick={back} className="px-5 py-2 rounded-lg bg-gray-800">Back</button>
            <button onClick={next} className="px-5 py-2 rounded-lg bg-blue-600">Continue</button>
          </div>
        </Section>
      )}

      {step === STEPS.PREFERENCES && (
        <Section title="Your preferences" subtitle="Networks and categories you're into.">
          <div className="mb-4">
            <div className="font-display mb-2">Preferred chains</div>
            <div className="flex flex-wrap gap-2">
              {["Polygon", "Ethereum", "Base", "BNB", "Arbitrum"].map((chain) => (
                <button
                  key={chain}
                  onClick={() => toggleArray("chains", chain)}
                  className={`px-3 py-1 rounded-full border text-sm ${
                    data.chains.includes(chain) ? "border-blue-500 bg-blue-500/10" : "border-gray-800 hover:border-gray-700"
                  }`}
                >
                  {chain}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <div className="font-display mb-2">Favorite categories</div>
            <div className="flex flex-wrap gap-2">
              {["Art", "Collectibles", "Gaming", "Music", "Photography", "Memberships"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => toggleArray("categories", cat)}
                  className={`px-3 py-1 rounded-full border text-sm ${
                    data.categories.includes(cat) ? "border-blue-500 bg-blue-500/10" : "border-gray-800 hover:border-gray-700"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-between gap-3 mt-6">
            <button onClick={back} className="px-5 py-2 rounded-lg bg-gray-800">Back</button>
            <button onClick={next} className="px-5 py-2 rounded-lg bg-blue-600">Continue</button>
          </div>
        </Section>
      )}

      {step === STEPS.NOTIFICATIONS && (
        <Section title="Stay in the loop" subtitle="Optional: get updates about drops and selling tips.">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={data.notifications}
              onChange={(e) => setData((p) => ({ ...p, notifications: e.target.checked }))}
            />
            <span className="text-gray-300">Opt-in to tips, updates and featured opportunities</span>
          </label>
          <div className="flex justify-between gap-3 mt-6">
            <button onClick={back} className="px-5 py-2 rounded-lg bg-gray-800">Back</button>
            <button onClick={next} className="px-5 py-2 rounded-lg bg-blue-600">Continue</button>
          </div>
        </Section>
      )}

      {step === STEPS.REVIEW && (
        <Section title="All set" subtitle="We’ll tailor your experience based on this.">
          <div className="space-y-2 text-gray-300">
            <div><span className="text-gray-400">Role:</span> {data.role || "-"}</div>
            {isCreator && (
              <div><span className="text-gray-400">Creator focus:</span> {data.creatorType.join(", ") || "-"}</div>
            )}
            <div><span className="text-gray-400">Experience:</span> {data.experience}</div>
            <div><span className="text-gray-400">Chains:</span> {data.chains.join(", ") || "-"}</div>
            <div><span className="text-gray-400">Categories:</span> {data.categories.join(", ") || "-"}</div>
          </div>
          <div className="flex justify-between gap-3 mt-6">
            <button onClick={back} className="px-5 py-2 rounded-lg bg-gray-800">Back</button>
            <button onClick={finish} className="px-5 py-2 rounded-lg bg-green-600">Finish</button>
          </div>
        </Section>
      )}
    </div>
  );
}


