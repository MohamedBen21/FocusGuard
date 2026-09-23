(function () {
  const SEARCH_KEYWORDS = [
  "4tube", "6streams", "8muses", "adultfriendfinder", "alphaporno", "analdin",
  "anyporn", "ashemaletube", "beeg", "bongacams", "boyfriendtv", "brazzers",
  "cam4", "camsoda", "chaturbate", "crazyshit", "drtuber", "efukt",
  "eporner", "erome", "extremetube", "fapdu", "fapello", "freeones",
  "fuq", "gotporn", "hanime", "hclips", "hentaihaven", "hqporner",
  "ixxx", "javfree", "javhd", "keezmovies", "livejasmin", "luxuretv",
  "missav", "motherless", "myfreecams", "nhentai", "noodlemagazine", "onlyfans",
  "porn300", "porn7", "pornbox", "porndig", "pornhub", "pornktube",
  "pornmd", "pornone", "porntrex", "redgifs", "redtube", "rule34",
  "spankbang", "spankwire", "streamate", "stripchat", "sunporno", "sxyprn",
  "thisvid", "thumbzilla", "tktube", "tnaflix", "tube8", "tubegalore",
  "txxx", "upornia", "vjav", "watchmygf", "xbabe", "xhamster",
  "xmoviesforyou", "xnxx", "xtube", "xvideos", "xvideos2", "xxxbunker",
  "xxxvideos", "youporn", "zbporn"
];

  const QUERY_PARAMS = ["q", "p", "wd", "word", "text", "query"];

  function extractQuery() {
    const params = new URLSearchParams(location.search);
    for (const key of QUERY_PARAMS) {
      const val = params.get(key);
      if (val) return val;
    }
    return "";
  }

  function matchKeyword(query) {
    const lower = query.toLowerCase();
    return SEARCH_KEYWORDS.find((kw) => new RegExp("\\b" + kw + "\\b", "i").test(lower)) || null;
  }

  function redirectToBlocked(term) {
    const params = new URLSearchParams({
      cat: "adult",
      reason: "search",
      site: term
    });
    const target = chrome.runtime.getURL(`blocked.html?${params.toString()}`);
    window.location.replace(target);
  }

  async function evaluate() {
    const query = extractQuery();
    if (!query) return;

    const hit = matchKeyword(query);
    if (!hit) return;

    const data = await chrome.storage.local.get("settings");
    const adultEnabled = data.settings ? data.settings.adult.master : true;
    if (!adultEnabled) return;

    redirectToBlocked(hit);
  }

  function patchHistory() {
    const fire = () => setTimeout(evaluate, 0);
    const origPush = history.pushState;
    const origReplace = history.replaceState;
    history.pushState = function (...args) {
      origPush.apply(this, args);
      fire();
    };
    history.replaceState = function (...args) {
      origReplace.apply(this, args);
      fire();
    };
    window.addEventListener("popstate", fire);
  }
  patchHistory();

  evaluate();
})();
