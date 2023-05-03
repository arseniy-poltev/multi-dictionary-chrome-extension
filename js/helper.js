function decodeHTMLEntities (str) {
  var txt = document.createElement("textarea");
  txt.innerHTML = str;
  return txt.value;
}

function endsWithPeriod(str) {
  str = str.trim();
  if (!str) return false;
  if (str.endsWith('.')) {
    return true;
  } else {
    return false;
  }
}

function removePeriod(str) {
  str = str.trim().replace(/\./g, '');
  return str;
}

function replaceTypoQuotes(str) {
  if (str) {
    return str.replace(/”|„|“|‟|«|»/g, '"').replace(/‘|’|‛|‚|‹|›/g, "'");
  }
  return str;
}

function removeSpeCharaceters(str) {
  if (/^[0-9€$¢£.,-]*$/.test(str)) {
    return null;
  }

  str = replaceTypoQuotes(str);
  
  var specChars = "&-!?,;:[](){}<>'\"";
  var start = 0, 
        end = str.length;

    while(start < end && specChars.indexOf(str[start]) >= 0)
        ++start;

    while(end > start && specChars.indexOf(str[end - 1]) >= 0)
        --end;

    var res = (start > 0 || end < str.length) ? str.substring(start, end) : str;
    return res;
}