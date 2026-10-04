"use client";

import { useState } from "react";
import ProfileForm from "./ProfileForm";
import { STAR_TOTAL, totalStars, type ProfileDraft } from "@/lib/profiles";
import { loadBest } from "@/lib/storage";
import type { Profile } from "@/lib/types";

interface Props {
  profiles: Profile[];
  currentId: string | null;
  onPick: (p: Profile) => void;
  onCreate: (draft: ProfileDraft) => void;
  onGuest: () => void;
  /** Clears a forgotten PIN after a grown-up check. */
  onResetPin: (p: Profile) => void;
}

export default function Players({ profiles, currentId, onPick, onCreate, onGuest, onResetPin }: Props) {
  const [adding, setAdding] = useState(profiles.length === 0);
  const [locked, setLocked] = useState<Profile | null>(null);

  if (adding) {
    return (
      <ProfileForm
        title="New player"
        profiles={profiles}
        submitLabel="Make my profile"
        onSubmit={onCreate}
        onCancel={profiles.length ? () => setAdding(false) : onGuest}
      />
    );
  }

  if (locked) {
    return (
      <PinPrompt
        profile={locked}
        onUnlock={() => onPick(locked)}
        onReset={() => onResetPin(locked)}
        onBack={() => setLocked(null)}
      />
    );
  }

  return (
    <section className="panel players">
      <h2>Who&apos;s playing?</h2>
      <p>Pick your profile so your stars and progress are saved for you.</p>
      <div className="pgrid">
        {profiles.map((p) => {
          const stars = totalStars(loadBest(p.id));
          return (
            <button
              key={p.id}
              type="button"
              className={`pcard${p.id === currentId ? " cur" : ""}`}
              onClick={() => (p.pin ? setLocked(p) : onPick(p))}
            >
              <span className="pav" aria-hidden="true">{p.avatar}</span>
              <span className="pname">{p.name}{p.pin && <span aria-label=", has a PIN"> 🔒</span>}</span>
              <span className="pmeta">
                ★ {stars}/{STAR_TOTAL}
                {p.lastPlayed ? ` · ${new Date(p.lastPlayed).toLocaleDateString(undefined, { day: "numeric", month: "short" })}` : " · New"}
              </span>
            </button>
          );
        })}
        <button type="button" className="pcard add" onClick={() => setAdding(true)}>
          <span className="pav" aria-hidden="true">＋</span>
          <span className="pname">New player</span>
        </button>
      </div>
      <div className="row center">
        <button className="linkbtn" type="button" onClick={onGuest}>Play as a guest (nothing is saved to a profile)</button>
      </div>
    </section>
  );
}

function PinPrompt({ profile, onUnlock, onReset, onBack }: { profile: Profile; onUnlock: () => void; onReset: () => void; onBack: () => void }) {
  const [pin, setPin] = useState("");
  const [wrong, setWrong] = useState(false);
  const [grownUp, setGrownUp] = useState<{ a: number; b: number } | null>(null);
  const [check, setCheck] = useState("");

  const enter = (v: string) => {
    setPin(v);
    setWrong(false);
    if (v.length === 4) {
      if (v === profile.pin) onUnlock();
      else {
        setWrong(true);
        setPin("");
      }
    }
  };

  return (
    <section className="panel pinbox">
      <span className="pav big" aria-hidden="true">{profile.avatar}</span>
      <h2>Hi {profile.name}!</h2>
      {!grownUp ? (
        <>
          <label htmlFor="pinIn" className="lab">Type your secret PIN</label>
          <input
            id="pinIn"
            className={`textin pinin${wrong ? " shake" : ""}`}
            type="password"
            inputMode="numeric"
            autoComplete="off"
            autoFocus
            maxLength={4}
            value={pin}
            aria-describedby="pinErr"
            onChange={(e) => enter(e.target.value.replace(/\D/g, ""))}
          />
          <span id="pinErr" className="ferr" role="alert">{wrong ? "That's not the right PIN. Try again." : ""}</span>
          <div className="row center">
            <button className="btn" type="button" onClick={onBack}>← Not me</button>
            <button
              className="linkbtn"
              type="button"
              onClick={() => setGrownUp({ a: 12 + Math.floor(Math.random() * 8), b: 13 + Math.floor(Math.random() * 7) })}
            >
              Forgot the PIN?
            </button>
          </div>
        </>
      ) : (
        <form
          className="group"
          onSubmit={(e) => {
            e.preventDefault();
            if (Number(check) === grownUp.a * grownUp.b) onReset();
            else setCheck("");
          }}
        >
          <label htmlFor="guIn" className="lab">Grown-up check: what is {grownUp.a} × {grownUp.b}?</label>
          <input id="guIn" className="textin" inputMode="numeric" autoComplete="off" autoFocus value={check} onChange={(e) => setCheck(e.target.value.replace(/\D/g, ""))} />
          <small className="tnote">The right answer removes the PIN, then a new one can be set under My progress.</small>
          <div className="row center">
            <button className="btn primary" type="submit" disabled={!check}>Remove the PIN</button>
            <button className="btn" type="button" onClick={() => setGrownUp(null)}>Back</button>
          </div>
        </form>
      )}
    </section>
  );
}
