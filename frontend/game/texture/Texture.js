/**
 * Kezdobarat magyarazat:
 * Fajl: frontend/game/texture/Texture.js
 * Szerep: Egyetlen texturahoz tartozo frame- es meretmetadata taroloja.
 * Olvasasi tipp: ne soronkent, hanem adatfolyamkent nezd (mi jon be -> mi tortenik vele -> mi megy ki).
 */
export class TextureID {
  static HEART = 0;
  static BLOCK = 1;

  // Block grade textures (0-14)
  static BLOCK_0 = 2;
  static BLOCK_1 = 3;
  static BLOCK_2 = 4;
  static BLOCK_3 = 5;
  static BLOCK_4 = 6;
  static BLOCK_5 = 7;
  static BLOCK_6 = 8;
  static BLOCK_7 = 9;
  static BLOCK_8 = 10;
  static BLOCK_9 = 11;
  static BLOCK_10 = 12;
  static BLOCK_11 = 13;
  static BLOCK_12 = 14;
  static BLOCK_13 = 15;
  static BLOCK_14 = 16;

  // Turret textures from third row of atlas
  static TURRET = 17;
  static TURRET2 = 18;
  static TURRET3 = 19;
  static TURRET4 = 20;
  static TURRET5 = 21;
  static TURRET6 = 22;
  static TURRET7 = 23;
  static TURRET8 = 24;
  static TURRET9 = 25;
  static TURRET10 = 26;
  static TURRET11 = 27;
  static TURRET12 = 28;
  static TURRET13 = 29;
  static TURRET14 = 30;
  static TURRET15 = 31;

  // Column 15 - special blocks
  static THRUSTER = 32;            // row 0 - thruster without connector
  static THRUSTER_CONNECTOR = 33;  // row 1 - thruster with connector
  static CORE = 34;                // row 2 - core block
}

export class SpriteID {
  static TEST = -1;
  static HEART = 0;
  static BLOCK = 1;

  // Block grade sprites (0-14)
  static BLOCK_0 = 2;
  static BLOCK_1 = 3;
  static BLOCK_2 = 4;
  static BLOCK_3 = 5;
  static BLOCK_4 = 6;
  static BLOCK_5 = 7;
  static BLOCK_6 = 8;
  static BLOCK_7 = 9;
  static BLOCK_8 = 10;
  static BLOCK_9 = 11;
  static BLOCK_10 = 12;
  static BLOCK_11 = 13;
  static BLOCK_12 = 14;
  static BLOCK_13 = 15;
  static BLOCK_14 = 16;

  // Turret sprites
  static TURRET = 17;
  static TURRET2 = 18;
  static TURRET3 = 19;
  static TURRET4 = 20;
  static TURRET5 = 21;
  static TURRET6 = 22;
  static TURRET7 = 23;
  static TURRET8 = 24;
  static TURRET9 = 25;
  static TURRET10 = 26;
  static TURRET11 = 27;
  static TURRET12 = 28;
  static TURRET13 = 29;
  static TURRET14 = 30;
  static TURRET15 = 31;

  // Special block sprites
  static THRUSTER = 32;
  static CORE = 33;

  // Projectile bullet sprite
  static BULLET = 34;
}
