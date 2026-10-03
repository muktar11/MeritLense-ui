"use client"

import { useEffect, useRef, useState } from "react"
import { Check, ChevronDown } from "lucide-react"

interface CoreSkillsDropdownProps {
  skills: Array<{ value: string; label: string }>
  selectedSkills: string[]
  onToggle: (skill: string) => void
  menuLabel: string
  placeholder: string
  selectedLabel: string
  selectRoleLabel: string
  disabled?: boolean
  className?: string
  onBlur?: () => void
}

export function CoreSkillsDropdown({
  skills,
  selectedSkills,
  onToggle,
  menuLabel,
  placeholder,
  selectedLabel,
  selectRoleLabel,
  disabled = false,
  className,
  onBlur,
}: CoreSkillsDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!isOpen) return

    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (event.target instanceof Node && !containerRef.current?.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("pointerdown", closeOnOutsidePointer)
    return () => document.removeEventListener("pointerdown", closeOnOutsidePointer)
  }, [isOpen])

  return (
    <div
      ref={containerRef}
      className="relative"
      onBlur={(event) => {
        if (!containerRef.current?.contains(event.relatedTarget as Node | null)) {
          onBlur?.()
        }
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape" && isOpen) {
          setIsOpen(false)
          triggerRef.current?.focus()
        }
      }}
    >
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
        className={className}
      >
        <span className={selectedSkills.length === 0 ? "text-gray-400" : "text-gray-900"}>
          {selectedSkills.length === 0 ? placeholder : selectedLabel}
        </span>
        <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
      </button>

      {isOpen && (
        <div
          role="listbox"
          aria-label={menuLabel}
          aria-multiselectable="true"
          className="absolute left-0 top-full z-[100] mt-1 w-full max-h-64 overflow-x-hidden overflow-y-auto rounded-md border border-gray-200 bg-white p-1 shadow-lg"
        >
          <div className="border-b border-gray-100 px-2 py-1.5 text-sm font-semibold text-gray-900">
            {menuLabel}
          </div>
          {skills.length === 0 ? (
            <div className="px-2 py-2 text-sm text-gray-500">{selectRoleLabel}</div>
          ) : (
            skills.map(({ value, label }) => {
              const selected = selectedSkills.includes(value)
              return (
                <button
                  key={value}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => onToggle(value)}
                  className="flex w-full cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm text-gray-900 outline-none hover:bg-gray-100 focus:bg-gray-100"
                >
                  <span className="flex size-4 shrink-0 items-center justify-center rounded-sm border border-gray-400">
                    {selected && <Check className="size-3" />}
                  </span>
                  <span className="min-w-0 flex-1 break-words whitespace-normal">{label}</span>
                </button>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
