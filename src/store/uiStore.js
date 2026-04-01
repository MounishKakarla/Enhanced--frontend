import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useUIStore = create(
  persist(
    (set) => ({
      // Chatbot configuration & state
      isChatOpen: false,
      chatWidth: 420,
      setChatOpen: (isOpen) => set({ isChatOpen: isOpen }),
      setChatWidth: (width) => set({ chatWidth: width }),

      // Global Command Palette
      paletteOpen: false,
      setPaletteOpen: (isOpen) => set({ paletteOpen: isOpen }),

      // Employee Side Sheet
      activeEmpId: null,
      isInactiveView: false,
      openEmployeeSheet: (empId, isInactive = false) => set({ activeEmpId: empId, isInactiveView: isInactive }),
      closeEmployeeSheet: () => set({ activeEmpId: null, isInactiveView: false }),

      // New Employee Side Sheet
      isNewEmployeeSheetOpen: false,
      setNewEmployeeSheetOpen: (isOpen) => set({ isNewEmployeeSheetOpen: isOpen }),

      // Shared width for all employee side sheets (resizable)
      sideSheetWidth: 700,
      setSideSheetWidth: (width) => set({ sideSheetWidth: width }),
    }),
    {
      name: 'ems-ui-storage', // key in localStorage
      partialize: (state) => ({ 
        chatWidth: state.chatWidth, 
        sideSheetWidth: state.sideSheetWidth 
      }), // only persist widths
    }
  )
)

