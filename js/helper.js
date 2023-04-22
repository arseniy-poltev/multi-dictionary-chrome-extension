function endsWithSpeCharacters(str) {
  var characters = ["!", "?", ".", ",", ":", ";"];
  str = str.trim();
  if (!str) return false;
  if (characters.some((s) => str.endsWith(s))) {
    return true;
  } else {
    return false;
  }
}

function removeSpeCharaceters(str) {
  var specChars = "-!?.,;:[](){}<>'\"";
  var start = 0, 
        end = str.length;

    while(start < end && specChars.indexOf(str[start]) >= 0)
        ++start;

    while(end > start && specChars.indexOf(str[end - 1]) >= 0)
        --end;

    return (start > 0 || end < str.length) ? str.substring(start, end) : str;
}