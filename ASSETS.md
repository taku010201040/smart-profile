# Assets

**Art direction:** A clean, premium tactical mobile-game look with sunlit ochre terrain, sparse readable cover, teal/cyan energy-zone lighting, cool blue sky, and high-contrast translucent HUD panels. The player view remains a slightly elevated third-person perspective, with an intentionally sparse arena that prioritizes tactical readability over visual noise.

| Name | Role | Intended size | Source file | Runtime use |
|---|---|---:|---|---|
| `reference-battlefield` | Visual QA benchmark for player scale, arena density, HUD placement, and palette | 2560×1440 px | [CDN URL](https://files.manuscdn.com/user_upload_by_module/session_file/310419663032246958/DUhhausTWsjzyver.png) | Lobby backdrop and implementation reference |
| `skyfront-ground` | Tileable dry-grass and soil material | 2 m repeat tile, repeated 12×12 on the arena | [CDN URL](https://files.manuscdn.com/user_upload_by_module/session_file/310419663032246958/tsFunooYPkFmLIGY.png) | Babylon ground diffuse texture |
| `skyfront-emblem` | Teal triangular player marker | 64×64 px in the lobby and 24×24 px in the HUD | [CDN URL](https://files.manuscdn.com/user_upload_by_module/session_file/310419663032246958/qtRUHFvpHMvoTkft.png) | PWA icon and lobby insignia where alpha is supported |

The terrain texture and visual benchmark are generated original assets. Arena geometry, health bars, joystick rings, buttons, minimap rings, zone arcs, bullets, and simple tactical props are code-rendered because they are geometric runtime elements rather than substitute artwork.
