export function FloatingWhatsApp() {
  const phone = process.env.NEXT_PUBLIC_BUSINESS_WHATSAPP ?? "8132049313";
  const message = encodeURIComponent("Olá! Vim pela vitrine online da VG Multiservice e gostaria de atendimento.");

  return (
    <a
      className="floating-whatsapp"
      href={`https://wa.me/${phone}?text=${message}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Falar com a VG Multiservice pelo WhatsApp"
    >
      <svg viewBox="0 0 32 32" aria-hidden="true" focusable="false">
        <path d="M16.02 3C8.86 3 3.04 8.8 3.04 15.93c0 2.29.6 4.53 1.75 6.52L3 29l6.75-1.76a13.08 13.08 0 0 0 6.26 1.59h.01c7.15 0 12.97-5.8 12.98-12.92A12.78 12.78 0 0 0 25.2 6.77 12.9 12.9 0 0 0 16.02 3Zm0 23.62h-.01c-1.95 0-3.87-.52-5.55-1.51l-.4-.24-4.01 1.05 1.07-3.9-.26-.41a10.72 10.72 0 0 1-1.66-5.68c0-5.96 4.87-10.8 10.83-10.8 2.89 0 5.61 1.12 7.65 3.16a10.7 10.7 0 0 1 3.17 7.63c0 5.96-4.86 10.8-10.83 10.8Zm5.94-8.09c-.33-.17-1.94-.95-2.24-1.06-.3-.11-.52-.17-.73.17-.22.33-.84 1.05-1.03 1.27-.19.22-.38.25-.7.08-.33-.16-1.39-.51-2.65-1.63-.98-.87-1.64-1.94-1.83-2.27-.19-.33-.02-.51.14-.68.15-.14.33-.38.49-.57.17-.19.22-.33.33-.55.11-.22.06-.41-.03-.57-.08-.17-.73-1.77-1-2.43-.27-.65-.54-.56-.73-.57h-.62c-.22 0-.57.08-.87.41-.3.33-1.14 1.11-1.14 2.71s1.17 3.15 1.33 3.37c.16.22 2.3 3.49 5.57 4.89.78.33 1.38.53 1.85.68.78.25 1.49.22 2.05.13.63-.09 1.94-.79 2.21-1.55.27-.77.27-1.43.19-1.57-.08-.14-.3-.22-.63-.38Z" fill="currentColor"/>
      </svg>
      <span>Fale com a gente</span>
    </a>
  );
}

