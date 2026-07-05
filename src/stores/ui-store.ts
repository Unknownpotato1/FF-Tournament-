"use client";

import { create } from "zustand";

export type ModalKind =
  | "login"
  | "tournamentDetails"
  | "payment"
  | "dashboard"
  | "admin"
  | "leaderboard"
  | "faq"
  | "privacy"
  | "terms"
  | "contact"
  | "profile"
  | "recharge"
  | "withdraw"
  | null;

type UIState = {
  activeModal: ModalKind;
  selectedTournamentId: string | null;
  openModal: (modal: ModalKind, tournamentId?: string | null) => void;
  closeModal: () => void;
  scrollTo: string | null;
  setScrollTo: (id: string | null) => void;
};

export const useUI = create<UIState>((set) => ({
  activeModal: null,
  selectedTournamentId: null,
  openModal: (modal, tournamentId = null) =>
    set({ activeModal: modal, selectedTournamentId: tournamentId }),
  closeModal: () => set({ activeModal: null, selectedTournamentId: null }),
  scrollTo: null,
  setScrollTo: (id) => set({ scrollTo: id }),
}));
