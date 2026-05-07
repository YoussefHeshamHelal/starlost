export default function MenuSoundIcon() {
  return (
    <svg className="menu-sound-icon" viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <path
        className="menu-sound-icon__speaker"
        d="M10 25h12l16-13v40L22 39H10z"
      />
      <path
        className="menu-sound-icon__wave menu-sound-icon__wave--inner"
        d="M43 24c3 4.2 3 11.8 0 16"
      />
      <path
        className="menu-sound-icon__wave menu-sound-icon__wave--outer"
        d="M49 17c7.2 8.1 7.2 21.9 0 30"
      />
      <path
        className="menu-sound-icon__mute"
        d="M47 19 17 49"
      />
    </svg>
  )
}
