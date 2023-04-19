function endsWithSpeCharacters(str) {
  var characters = ["!", "?", ".", ",", ":"];
  str = str.trim();
  if (!str) return false;
  if (characters.some((s) => str.endsWith(s))) {
    return true;
  } else {
    return false;
  }
}
