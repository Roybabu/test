# Font audit

All six design stylesheets were audited. The application actually declares these font families:

- Board: Archivo, Inter, Roboto Mono
- Jobcard: IBM Plex Sans, IBM Plex Mono (self-hosted)
- Index: Fraunces, Inter
- Blocks: Anton, Archivo
- Splitdesk: DM Sans, DM Mono
- Neu: Poppins

Google Fonts stylesheets are no longer loaded eagerly from `garage-finder.html`. Each design loads only its own font stylesheet when selected; unused designs are warmed lazily after the interface becomes interactive. Jobcard uses locally hosted IBM Plex files. Only the primary Inter stylesheet is preloaded for the default Board design.
