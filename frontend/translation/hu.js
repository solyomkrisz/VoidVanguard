/**
 * Kezdobarat magyarazat:
 * Fajl: frontend/translation/hu.js
 * Szerep: Forditasi reteg: tobbnyelvu szovegek es lokalizacios segedfuggvenyek.
 * Olvasasi tipp: ne soronkent, hanem adatfolyamkent nezd (mi jon be -> mi tortenik vele -> mi megy ki).
 */
// prettier-ignore
export default {
  "none": "A kérés feldolgozása közben váratlan hiba történt",

  "TestError": "Ez egy teszthiba",
  "UserNotFoundError": "A felhasználó nem található",
  "InvalidCredentialsError": "Érvénytelen hitelesítő adatok",
  "NoDataProvidedError": "Nincs megadott adat",
  "NoDataChangeError": "Frissítés kihagyva: a megadott adatok megegyeznek a meglévőkkel",
  "InvalidRequestError": "Érvénytelen kérés",
  "InvalidTokenError": "Érvénytelen token",
  "InvalidResetTokenError": "Érvénytelen jelszó-visszaállítási token",
  "ProfileNotFoundError": "A profil nem található",

  "InitiatorBlockedRecipientError": "Nem lehet folytatni, a felhasználó le van tiltva",
  "RecipientBlockedInitiatorError": "A fogadó fél letiltotta a kezdeményezőt",
  "BothBlockedError": "Mindkét felhasználó letiltotta egymást",

  "CannotBlockYourselfError": "Nem tilthatod le saját magad",
  "UnableToUnblockError": "Nem sikerült feloldani a tiltást: a tiltás nem létezik",

  "CannotFriendYourselfError": "Nem jelölheted be saját magad ismerősnek",
  "FriendshipExistsError": "Az ismeretség már létezik",
  "UnableToAcceptFriendRequestError": "Nem sikerült elfogadni a jelölést, mert nem létezik",
  "UnableToRemoveFriendError": "Nem sikerült törölni az ismeretséget, mert nem létezik",

  "UnauthorizedError": "Nincs jogosultságod",
  "ForbiddenError": "Nincs jogosultságod ehhez a művelethez",

  "SaveError": "A játékállapot mentése nem sikerült",
  "DuplicateSaveStateError": "Ezzel az állapottal már létezik mentés",
  "SaveNotFoundError": "A mentés nem található",
  "GameIsFinishedError": "A mentés nem módosítható, mert a játék már véget ért",

  "PasswordUpdateError": "A jelszó frissítése nem sikerült",

  "RefreshTokenExpirationError": "A frissítő token lejárt",
  "NoRefreshTokenError": "Nem lett megadva frissítő token",

  "SessionDestroyError": "Nem sikerült lezárni a munkamenetet",

  "CannotBanYourselfError": "Nem bannolhatod saját magad",
  "BanHigherRoleError": "Nem bannolhatsz ugyanilyen vagy magasabb rangú felhasználót",

  "CommentNotFoundError": "A hozzászólás nem található",
}
