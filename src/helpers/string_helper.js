class StringHelper {
  regexIndexOf(string, regex, startpos) {
    var indexOf = string.substring(startpos || 0).search(regex);
    return indexOf >= 0 ? indexOf + (startpos || 0) : indexOf;
  }

  replaceAll(string, regex, replacement) {
    return string.replace(new RegExp(regex, "g"), replacement);
  }

  replaceAllIgnoreCase(string, regex, replacement) {
    return string.replace(new RegExp(regex, "g", "i"), replacement);
  }

  regexLastIndexOf(string, regex, startpos) {
    regex = regex.global
      ? regex
      : new RegExp(
          regex.source,
          "g" + (regex.ignoreCase ? "i" : "") + (regex.multiLine ? "m" : "")
        );
    if (typeof startpos == "undefined") {
      startpos = this.length;
    } else if (startpos < 0) {
      startpos = 0;
    }
    var stringToWorkWith = string.substring(0, startpos + 1);
    var lastIndexOf = -1;
    var nextStop = 0;
    while ((result = regex.exec(stringToWorkWith)) != null) {
      lastIndexOf = result.index;
      regex.lastIndex = ++nextStop;
    }
    return lastIndexOf;
  }

  determineStringIsLike(val1, val2) {
    //TODO: LIKE fails on reserved regex characters (., +, etc)
    let regex = this.replaceAll(val2, "%", ".*");
    regex = this.replaceAll(regex, "_", ".{1}");
    // regex= this.replaceAll(regex,'\+','\+');
    let re = new RegExp("^" + regex + "$", "g");
    return re.test(val1);
  }

  getParsedValue(stringVal, quotesMandatory) {
    if (!isNaN(stringVal)) {
      return parseFloat(stringVal);
    } else if (stringVal === "true" || stringVal === "false") {
      return stringVal === "true";
    } else if (stringVal === "null") {
      return null;
    } else if (Object.keys(SQL_FUNCTIONS).includes(stringVal.toLowerCase())) {
      return SQL_FUNCTIONS[stringVal.toLowerCase()]();
    } else if (quotesMandatory) {
      stringVal = stringVal.trim();
      if (stringVal.match(/^["|'].+["|']$/)) {
        return stringVal.replace(/["']/g, "");
      } else if (this.isMath(stringVal)) {
        return this.executeFunction(stringVal);
      } else {
        return {
          FIRESTATION_DATA_PROP: stringVal
        };
      }
    } else {
      stringVal = stringVal.trim();
      return stringVal.replace(/["']/g, "");
    }
  }

  isMath(stringVal) {
    //TODO:
    return false || stringVal;
  }

  executeFunction(stringVal) {
    TODO: return null || stringVal;
  }
}

export default new StringHelper();

const SQL_FUNCTIONS = {
  "rand()": () => Math.random()
};
