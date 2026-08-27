(function () {
  "use strict";

  var list = document.getElementById("songs-list");
  var search = document.getElementById("filter-song");
  var genreFilter = document.getElementById("filter-genre");
  var openSongs = new Set();
  var bilibiliIcon = "assets/images/icon-bilibili.svg";

  if (!list || typeof songsData === "undefined") return;

  function escapeHTML(value) {
    var node = document.createElement("span");
    node.textContent = value == null ? "" : String(value);
    return node.innerHTML;
  }

  function songKey(song, index) {
    return song.title + "::" + index;
  }

  function sourceHref(item) {
    var link = String(item.link || "").trim();
    if (/^https:\/\/(?:www\.|m\.)?bilibili\.com\//i.test(link) || /^https:\/\/b23\.tv\//i.test(link)) {
      return link;
    }
    return "https://www.bilibili.com/video/" + encodeURIComponent(String(item.bv || "").trim());
  }

  function fillGenres() {
    var genres = [];
    songsData.songs.forEach(function (song) {
      if (song.genre && genres.indexOf(song.genre) === -1) genres.push(song.genre);
    });
    genres.sort(function (a, b) { return a.localeCompare(b, "zh-CN"); });
    genres.forEach(function (genre) {
      var option = document.createElement("option");
      option.value = genre;
      option.textContent = genre;
      genreFilter.appendChild(option);
    });
  }

  function filteredSongs() {
    var keyword = search.value.trim().toLocaleLowerCase("zh-CN");
    var genre = genreFilter.value;
    return songsData.songs.map(function (song, index) {
      return { song: song, index: index };
    }).filter(function (entry) {
      var song = entry.song;
      var textMatch = !keyword || [song.title, song.singer, song.genre].some(function (value) {
        return String(value || "").toLocaleLowerCase("zh-CN").indexOf(keyword) !== -1;
      });
      return textMatch && (!genre || song.genre === genre);
    }).sort(function (a, b) {
      var countA = Array.isArray(a.song.items) ? a.song.items.length : 0;
      var countB = Array.isArray(b.song.items) ? b.song.items.length : 0;
      return countB - countA || a.index - b.index;
    });
  }

  function render() {
    var entries = filteredSongs();
    if (!entries.length) {
      list.innerHTML = '<li class="songs-list__empty">暂无歌曲</li>';
      return;
    }

    list.innerHTML = entries.map(function (entry) {
      var song = entry.song;
      var key = songKey(song, entry.index);
      var isOpen = openSongs.has(key);
      var items = Array.isArray(song.items) ? song.items.slice().sort(function (a, b) {
        return String(a.date || "").localeCompare(String(b.date || ""));
      }) : [];
      var detailId = "song-detail-" + entry.index;
      var details = items.map(function (item) {
        var href = sourceHref(item);
        return '<li class="song-sub">'
          + '<time class="song-sub__date" datetime="' + escapeHTML(item.date) + '">' + escapeHTML(item.date) + '</time>'
          + '<a class="song-sub__source" href="' + escapeHTML(href) + '" target="_blank" rel="noopener noreferrer" aria-label="在哔哩哔哩查看">'
          + '<img src="' + bilibiliIcon + '" alt="" width="30" height="30">'
          + '</a></li>';
      }).join("");

      return '<li class="song-item' + (isOpen ? ' song-item--open' : '') + '" role="row">'
        + '<button class="song-item__header" type="button" data-key="' + escapeHTML(key) + '" aria-expanded="' + isOpen + '" aria-controls="' + detailId + '">'
        + '<span class="song-item__title" role="cell">' + escapeHTML(song.title) + '</span>'
        + '<span class="song-item__singer" role="cell">' + escapeHTML(song.singer) + '</span>'
        + '<span class="song-item__genre" role="cell">' + escapeHTML(song.genre) + '</span>'
        + '<span class="song-item__arrow"><span class="chevron" aria-hidden="true"></span></span>'
        + '</button>'
        + '<div class="song-item__body" id="' + detailId + '"><div class="song-item__body-inner">'
        + (details ? '<ul class="song-item__sublist">' + details + '</ul>' : '<p class="song-item__empty">暂无内容</p>')
        + '</div></div></li>';
    }).join("");

    list.querySelectorAll(".song-item__header").forEach(function (button) {
      button.addEventListener("click", function () {
        var key = button.getAttribute("data-key");
        if (openSongs.has(key)) openSongs.delete(key);
        else openSongs.add(key);
        render();
      });
    });
  }

  fillGenres();
  search.addEventListener("input", render);
  genreFilter.addEventListener("change", render);
  render();
})();
