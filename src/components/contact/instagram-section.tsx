const instagramUrl = "https://www.instagram.com/vgmultservice_/";

export function InstagramSection() {
  return (
    <section className="instagram-section" aria-labelledby="instagram-title">
      <div className="instagram-emblem" aria-hidden="true">
        <svg viewBox="0 0 24 24" focusable="false">
          <rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" strokeWidth="1.8" />
          <circle cx="12" cy="12" r="4.2" fill="none" stroke="currentColor" strokeWidth="1.8" />
          <circle cx="17.6" cy="6.7" r="1.15" fill="currentColor" />
        </svg>
      </div>
      <div className="instagram-copy">
        <p className="eyebrow">Acompanhe a VG</p>
        <h2 id="instagram-title">Ideias, cores e projetos <span>no Instagram.</span></h2>
        <p>Veja novidades e conheça mais do trabalho da VG Multiservice pelo nosso perfil.</p>
      </div>
      <a className="button button-outline instagram-button" href={instagramUrl} target="_blank" rel="noopener noreferrer">
        <span>@vgmultservice_</span><span aria-hidden="true">↗</span>
      </a>
      <div className="instagram-decoration" aria-hidden="true"><span>VG</span><i>✳</i><b>+</b></div>
    </section>
  );
}

