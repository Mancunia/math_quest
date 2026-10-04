"use client";

import { useState } from "react";
import { AVATARS, NAME_MAX, checkName, validPin, type ProfileDraft } from "@/lib/profiles";
import type { Profile } from "@/lib/types";

interface Props {
  title: string;
  profiles: Profile[];
  /** The profile being edited; leave out to make a new one. */
  editing?: Profile;
  submitLabel: string;
  onSubmit: (draft: ProfileDraft) => void;
  onCancel?: () => void;
}

export default function ProfileForm({ title, profiles, editing, submitLabel, onSubmit, onCancel }: Props) {
  const [name, setName] = useState(editing?.name ?? "");
  const [avatar, setAvatar] = useState(editing?.avatar ?? AVATARS[profiles.length % AVATARS.length]);
  const [pin, setPin] = useState(editing?.pin ?? "");
  const [tried, setTried] = useState(false);
  const nameError = checkName(name, profiles, editing?.id);
  const pinError = validPin(pin) ? "" : "A PIN is 4 numbers, or leave it empty.";

  return (
    <form
      className="panel pform"
      onSubmit={(e) => {
        e.preventDefault();
        setTried(true);
        if (!nameError && !pinError) onSubmit({ name, avatar, pin });
      }}
    >
      <h2>{title}</h2>

      <div className="group">
        <label className="lab" htmlFor="pfName">Name</label>
        <input
          id="pfName"
          className="textin"
          maxLength={NAME_MAX}
          autoComplete="off"
          placeholder="Type your name"
          value={name}
          aria-invalid={tried && !!nameError}
          aria-describedby="pfNameErr"
          onChange={(e) => setName(e.target.value)}
        />
        <span id="pfNameErr" className="ferr" role="alert">{tried ? nameError : ""}</span>
      </div>

      <div className="group">
        <span className="lab" id="pfAvLab">Pick a picture</span>
        <div className="avatars" role="radiogroup" aria-labelledby="pfAvLab">
          {AVATARS.map((a) => (
            <button key={a} type="button" role="radio" aria-checked={a === avatar} aria-label={a} onClick={() => setAvatar(a)}>
              {a}
            </button>
          ))}
        </div>
      </div>

      <div className="group">
        <label className="lab" htmlFor="pfPin">Secret PIN (optional)</label>
        <input
          id="pfPin"
          className="textin pinin"
          type="password"
          inputMode="numeric"
          autoComplete="off"
          maxLength={4}
          placeholder="4 numbers"
          value={pin}
          aria-invalid={tried && !!pinError}
          aria-describedby="pfPinNote"
          onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
        />
        <small id="pfPinNote" className="tnote">
          {tried && pinError ? <span className="ferr">{pinError}</span> : "Stops others playing as you on this device. It isn't a password."}
        </small>
      </div>

      <div className="row">
        <button className="btn primary" type="submit">{submitLabel}</button>
        {onCancel && <button className="btn" type="button" onClick={onCancel}>Cancel</button>}
      </div>
    </form>
  );
}
