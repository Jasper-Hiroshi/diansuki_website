/**
 * diansss.com — 歌单页脚本
 * 功能：手风琴歌单、源链接跳转、底部音频播放器（后台播放）、播放队列/模式
 */
(function () {
  "use strict";

  var songsList = document.getElementById("songs-list");
  var filterSong = document.getElementById("filter-song");
  var audioBar = document.getElementById("audio-bar");
  var audioBarSongTitle = audioBar ? audioBar.querySelector(".audio-bar__song-title") : null;
  var audioBarNote = audioBar ? audioBar.querySelector(".audio-bar__note") : null;
  var audioBarPlayBtn = audioBar ? audioBar.querySelector(".audio-bar__play") : null;
  var audioBarFill = document.getElementById("audio-bar-fill");
  var audioBarTime = document.getElementById("audio-bar-time");
  var audioBarProgress = document.getElementById("audio-bar-progress");
  var audioBarClose = audioBar ? audioBar.querySelector(".audio-bar__close") : null;
  var audioEl = document.getElementById("audio-player");

  var expandedIndex = -1;
  var currentSongTitle = "";
  var currentNote = "";
  var isDragging = false;

  /* ---- 播放模式 ---- */
  var MODE_LABELS = ["顺序", "随机", "单曲"];
  var modeBtn = document.getElementById("audio-bar-mode");
  var playlist = [];

  function getPlayMode() {
    if (!modeBtn) return 0;
    var t = modeBtn.textContent;
    for (var i = 0; i < MODE_LABELS.length; i++) {
      if (MODE_LABELS[i] === t) return i;
    }
    return 0;
  }

  if (modeBtn) {
    modeBtn.textContent = "顺序";
    modeBtn.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      var cur = getPlayMode();
      var next = (cur + 1) % MODE_LABELS.length;
      modeBtn.textContent = MODE_LABELS[next];
    });
  }

  /* ---- HTML 转义 ---- */
  function escapeHTML(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  /* ---- 时间格式化 ---- */
  function formatTime(seconds) {
    if (isNaN(seconds) || !isFinite(seconds)) return "00:00";
    var m = Math.floor(seconds / 60);
    var s = Math.floor(seconds % 60);
    return (m < 10 ? "0" + m : m) + ":" + (s < 10 ? "0" + s : s);
  }

  /* ---- 显示/隐藏底部播放器 ---- */
  function showAudioBar() {
    if (audioBar) audioBar.hidden = false;
    document.body.style.paddingBottom = "70px";
  }

  function hideAudioBar() {
    if (audioBar) audioBar.hidden = true;
    document.body.style.paddingBottom = "";
    if (audioEl) {
      audioEl.pause();
      audioEl.removeAttribute("src");
    }
  }

  /* ---- 更新播放按钮图标 ---- */
  function updatePlayIcon() {
    if (!audioBarPlayBtn) return;
    var paused = !(audioEl && !audioEl.paused);
    audioBarPlayBtn.textContent = paused ? "▶" : "⏸";
    if (paused) {
      audioBarPlayBtn.classList.remove("audio-bar__play--paused");
    } else {
      audioBarPlayBtn.classList.add("audio-bar__play--paused");
    }
  }

  /* ---- 更新进度条和时间 ---- */
  function updateProgress() {
    if (!audioEl || !audioBarFill) return;
    var current = audioEl.currentTime || 0;
    var duration = audioEl.duration || 0;
    var pct = duration > 0 ? (current / duration) * 100 : 0;
    audioBarFill.style.width = pct + "%";
    if (audioBarTime) audioBarTime.textContent = formatTime(current) + "/" + formatTime(duration);
  }

  /* ---- 播放指定音频 ---- */
  function playAudio(songTitle, note, audioUrl, fallbackLink, coverUrl) {
    if (!audioUrl) {
      window.open(fallbackLink, "_blank", "noopener,noreferrer");
      return;
    }
    if (!audioEl) return;

    currentSongTitle = songTitle;
    currentNote = note;

    if (audioBarSongTitle) audioBarSongTitle.textContent = songTitle;
    if (audioBarNote) audioBarNote.textContent = note;

    var coverEl = document.getElementById("audio-bar-cover");
    if (coverEl) {
      coverEl.src = coverUrl || "";
      coverEl.style.display = coverUrl ? "" : "none";
    }

    audioEl.src = audioUrl;
    audioEl.load();
    audioEl.play().catch(function () {});

    showAudioBar();
    updatePlayIcon();
  }

  /* ---- 添加歌曲到队列（去重，追加到末尾） ---- */
  function addToQueue(songTitle, note, audioUrl, linkUrl, coverUrl) {
    if (!audioUrl) return false;
    for (var i = 0; i < playlist.length; i++) {
      if (playlist[i].audioUrl === audioUrl) return false; /* 已存在 */
    }
    playlist.push({
      songTitle: songTitle,
      note: note,
      audioUrl: audioUrl,
      linkUrl: linkUrl,
      coverUrl: coverUrl
    });
    return true;
  }

  /* ---- 将指定歌曲置顶并播放 ---- */
  function playAsFirst(songTitle, note, audioUrl, linkUrl, coverUrl) {
    for (var i = 0; i < playlist.length; i++) {
      if (playlist[i].audioUrl === audioUrl) {
        if (i > 0) {
          var item = playlist.splice(i, 1)[0];
          playlist.unshift(item);
        }
        playQueueTop();
        return;
      }
    }
    /* 不在队列中则加入并置顶 */
    if (!audioUrl) return;
    playlist.unshift({
      songTitle: songTitle,
      note: note,
      audioUrl: audioUrl,
      linkUrl: linkUrl,
      coverUrl: coverUrl
    });
    playQueueTop();
  }

  /* ---- 播放队列第一首 ---- */
  function playQueueTop() {
    if (playlist.length === 0) {
      hideAudioBar();
      renderPlaylistPanel();
      return;
    }
    var item = playlist[0];
    playAudio(item.songTitle, item.note, item.audioUrl, item.linkUrl, item.coverUrl);
    renderPlaylistPanel();
  }

  /* ---- 播放下一首 ---- */
  function playNext() {
    if (playlist.length === 0) return;
    var pm = getPlayMode();
    if (pm === 2) {
      /* 单曲 */
      if (audioEl) { audioEl.currentTime = 0; audioEl.play().catch(function () {}); }
      return;
    }
    if (pm === 1) {
      /* 随机 */
      var ri = Math.floor(Math.random() * playlist.length);
      var ritem = playlist.splice(ri, 1)[0];
      playlist.unshift(ritem);
    } else {
      /* 顺序：第一首移到末尾，循环 */
      if (playlist.length > 1) {
        var citem = playlist.shift();
        playlist.push(citem);
      }
    }
    playQueueTop();
  }

  /* ---- 播放列表面板 ---- */
  var playlistPanel = document.getElementById("playlist-panel");
  var playlistPanelList = document.getElementById("playlist-panel-list");
  var playlistSelectAll = document.getElementById("playlist-select-all");
  var playlistPanelClose = document.getElementById("playlist-panel-close");
  var playlistBtn = document.getElementById("audio-bar-playlist-btn");

  function renderPlaylistPanel() {
    if (!playlistPanelList) return;
    var html = "";
    if (playlist.length === 0) {
      html = "<li class=\"songs-list__empty\">播放列表为空</li>";
    } else {
      playlist.forEach(function (item, i) {
        var cls = "playlist-panel__item" + (i === 0 ? " playlist-panel__item--current" : "");
        html += "<li class=\"" + cls + "\" data-index=\"" + i + "\">";
        html += "<span class=\"playlist-panel__item-info\">";
        html += "<span class=\"playlist-panel__item-title\">" + escapeHTML(item.songTitle) + "</span>";
        html += "<span class=\"playlist-panel__item-note\">" + escapeHTML(item.note) + "</span>";
        html += "</span>";
        html += "<button class=\"playlist-panel__item-remove\" type=\"button\" data-index=\"" + i + "\" title=\"移除\">✕</button>";
        html += "</li>";
      });
    }
    playlistPanelList.innerHTML = html;

    /* 点击播放 */
    playlistPanelList.querySelectorAll(".playlist-panel__item").forEach(function (el) {
      el.addEventListener("click", function (e) {
        if (e.target.classList.contains("playlist-panel__item-remove")) return;
        var idx = parseInt(el.getAttribute("data-index"), 10);
        if (idx === 0) return;
        var item = playlist.splice(idx, 1)[0];
        playlist.unshift(item);
        playQueueTop();
      });
    });

    /* 移除 */
    playlistPanelList.querySelectorAll(".playlist-panel__item-remove").forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        var idx = parseInt(btn.getAttribute("data-index"), 10);
        playlist.splice(idx, 1);
        if (idx === 0) {
          playQueueTop();
        } else {
          renderPlaylistPanel();
        }
      });
    });
  }

  function openPlaylistPanel() {
    playlistPanel.hidden = false;
    setTimeout(function () { playlistPanel.classList.add("playlist-panel--open"); }, 10);
  }

  function closePlaylistPanel() {
    playlistPanel.classList.remove("playlist-panel--open");
    setTimeout(function () { playlistPanel.hidden = true; }, 300);
  }

  if (playlistBtn) {
    playlistBtn.addEventListener("click", function () {
      if (playlistPanel.hidden || !playlistPanel.classList.contains("playlist-panel--open")) {
        renderPlaylistPanel();
        openPlaylistPanel();
      } else {
        closePlaylistPanel();
      }
    });
  }

  if (playlistPanelClose) {
    playlistPanelClose.addEventListener("click", closePlaylistPanel);
  }

  /* 全选 */
  if (playlistSelectAll) {
    playlistSelectAll.addEventListener("click", function () {
      songsData.songs.forEach(function (song) {
        song.items.forEach(function (item) {
          if (item.audio) {
            addToQueue(song.title, item.note, item.audio, item.link || "", song.cover || "");
          }
        });
      });
      if (playlist.length > 0 && !audioEl.src) playQueueTop();
      else renderPlaylistPanel();
    });
  }

  var playlistClear = document.getElementById("playlist-clear");
  if (playlistClear) {
    playlistClear.addEventListener("click", function () {
      playlist = [];
      hideAudioBar();
      renderPlaylistPanel();
    });
  }

  /* ---- 进度条点击 & 拖拽 ---- */
  function seekFromEvent(e) {
    if (!audioEl || !audioBarProgress) return;
    var rect = audioBarProgress.getBoundingClientRect();
    var x = e.clientX - rect.left;
    var pct = Math.max(0, Math.min(1, x / rect.width));
    if (audioEl.duration) {
      audioEl.currentTime = pct * audioEl.duration;
    }
    updateProgress();
  }

  if (audioBarProgress) {
    audioBarProgress.addEventListener("click", seekFromEvent);
    audioBarProgress.addEventListener("mousedown", function (e) {
      isDragging = true;
      seekFromEvent(e);
    });
    document.addEventListener("mousemove", function (e) {
      if (!isDragging) return;
      seekFromEvent(e);
    });
    document.addEventListener("mouseup", function () { isDragging = false; });
    audioBarProgress.addEventListener("touchstart", function (e) {
      isDragging = true;
      seekFromEvent(e.touches[0]);
    }, { passive: false });
    document.addEventListener("touchmove", function (e) {
      if (!isDragging) return;
      seekFromEvent(e.touches[0]);
    }, { passive: false });
    document.addEventListener("touchend", function () { isDragging = false; });
  }

  /* ---- Audio 事件 ---- */
  if (audioEl) {
    audioEl.addEventListener("timeupdate", updateProgress);
    audioEl.addEventListener("play", updatePlayIcon);
    audioEl.addEventListener("pause", updatePlayIcon);
    audioEl.addEventListener("loadedmetadata", updateProgress);
    audioEl.addEventListener("error", function () { hideAudioBar(); });

    /* 播放完毕自动切歌 */
    audioEl.addEventListener("ended", function () {
      updatePlayIcon();
      if (playlist.length === 0) return;
      playNext();
    });
  }

  /* ---- 关闭播放器 ---- */
  if (audioBarClose) {
    audioBarClose.addEventListener("click", function () {
      hideAudioBar();
      updatePlayIcon();
    });
  }

  /* ---- 播放器播放/暂停按钮 ---- */
  if (audioBarPlayBtn) {
    audioBarPlayBtn.addEventListener("click", function () {
      if (!audioEl || !audioEl.src) return;
      if (audioEl.paused) {
        audioEl.play().catch(function () {});
      } else {
        audioEl.pause();
      }
      updatePlayIcon();
    });
  }

  /* ---- 过滤 ---- */
  function getFilteredSongs() {
    var keyword = filterSong ? filterSong.value.trim().toLowerCase() : "";
    if (!keyword) return songsData.songs;
    return songsData.songs.filter(function (song) {
      if (song.title.toLowerCase().indexOf(keyword) !== -1) return true;
      return song.items.some(function (item) {
        return item.note.toLowerCase().indexOf(keyword) !== -1;
      });
    });
  }

  /* ---- 渲染 ---- */
  function render() {
    if (!songsList) return;
    var songs = getFilteredSongs();
    var html = "";

    if (songs.length === 0) {
      html = "<li class=\"songs-list__empty\">无匹配歌曲</li>";
    } else {
      songs.forEach(function (song, idx) {
        var isOpen = idx === expandedIndex;
        html += "<li class=\"song-item" + (isOpen ? " song-item--open" : "") + "\">";
        html += "<button class=\"song-item__header\" type=\"button\" data-index=\"" + idx + "\">";
        var thumbStyle = song.cover ? " style=\"background-image:url(" + encodeURI(song.cover) + ");background-size:cover;background-position:center\"" : "";
        html += "<span class=\"song-item__thumb\"" + thumbStyle + " role=\"img\" aria-label=\"" + escapeHTML(song.title) + " 封面\"></span>";
        html += "<span class=\"song-item__title\">" + escapeHTML(song.title) + "</span>";
        html += "<span class=\"song-item__arrow\" aria-hidden=\"true\"></span>";
        html += "</button>";

        html += "<div class=\"song-item__body\"><div class=\"song-item__body-inner\">";
        if (song.items.length === 0) {
          html += "<p class=\"song-item__empty\">暂无内容</p>";
        } else {
          html += "<ul class=\"song-item__sublist\">";
          song.items.forEach(function (item) {
            var audioUrl = item.audio || "";
            var linkUrl = item.link || "";

            html += "<li class=\"song-sub\">";
            html += "<span class=\"song-sub__info\">";
            html += "<span class=\"song-sub__note\">" + escapeHTML(item.note) + "</span>";
            html += "<time class=\"song-sub__date\" datetime=\"" + item.date + "\">" + item.date + "</time>";
            html += "</span>";
            html += "<span class=\"song-sub__actions\">";

            if (linkUrl) {
              html += "<a class=\"song-sub__source\" href=\"" + encodeURI(linkUrl) + "\" target=\"_blank\" rel=\"noopener noreferrer\" title=\"查看源切片/直播\">🔗</a>";
            }

            /* 添加到队列按钮 */
            html += "<button class=\"song-sub__queue\" type=\"button\""
              + " data-song=\"" + escapeHTML(song.title) + "\""
              + " data-note=\"" + escapeHTML(item.note) + "\""
              + " data-audio=\"" + (audioUrl ? encodeURI(audioUrl) : "") + "\""
              + " data-link=\"" + (linkUrl ? encodeURI(linkUrl) : "") + "\""
              + " data-cover=\"" + (song.cover ? encodeURI(song.cover) : "") + "\""
              + " title=\"添加到播放队列\">＋</button>";

            /* 播放按钮 */
            html += "<button class=\"song-sub__play\" type=\"button\""
              + " data-song=\"" + escapeHTML(song.title) + "\""
              + " data-note=\"" + escapeHTML(item.note) + "\""
              + " data-audio=\"" + (audioUrl ? encodeURI(audioUrl) : "") + "\""
              + " data-link=\"" + (linkUrl ? encodeURI(linkUrl) : "") + "\""
              + " data-cover=\"" + (song.cover ? encodeURI(song.cover) : "") + "\""
              + " title=\"播放\">▶</button>";

            html += "</span>";
            html += "</li>";
          });
          html += "</ul>";
        }
        html += "</div></div>";
        html += "</li>";
      });
    }

    songsList.innerHTML = html;

    /* 绑定展开事件 */
    var headers = songsList.querySelectorAll(".song-item__header");
    headers.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var idx = parseInt(btn.getAttribute("data-index"), 10);
        expandedIndex = expandedIndex === idx ? -1 : idx;
        render();
      });
    });

    /* 绑定播放按钮事件 */
    var playBtns = songsList.querySelectorAll(".song-sub__play");
    playBtns.forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        var songTitle = btn.getAttribute("data-song") || "";
        var note = btn.getAttribute("data-note") || "";
        var audioUrl = decodeURIComponent(btn.getAttribute("data-audio") || "");
        var fallbackLink = decodeURIComponent(btn.getAttribute("data-link") || "");
        var coverUrl = decodeURIComponent(btn.getAttribute("data-cover") || "");
        playAsFirst(songTitle, note, audioUrl, fallbackLink, coverUrl);
      });
    });

    /* 绑定队列添加按钮 */
    var queueBtns = songsList.querySelectorAll(".song-sub__queue");
    queueBtns.forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        var songTitle = btn.getAttribute("data-song") || "";
        var note = btn.getAttribute("data-note") || "";
        var audioUrl = decodeURIComponent(btn.getAttribute("data-audio") || "");
        var linkUrl = decodeURIComponent(btn.getAttribute("data-link") || "");
        var coverUrl = decodeURIComponent(btn.getAttribute("data-cover") || "");
        if (!audioUrl) return;
        addToQueue(songTitle, note, audioUrl, linkUrl, coverUrl);
        renderPlaylistPanel();
        btn.textContent = "✓";
        setTimeout(function () { btn.textContent = "＋"; }, 800);
      });
    });
  }

  /* ---- 搜索事件 ---- */
  if (filterSong) {
    filterSong.addEventListener("input", function () {
      expandedIndex = -1;
      render();
    });
  }

  /* 上一首 / 下一首 */
  var prevBtn = document.getElementById("audio-bar-prev");
  var nextBtn = document.getElementById("audio-bar-next");

  if (prevBtn) {
    prevBtn.addEventListener("click", function () {
      if (playlist.length < 2) return;
      var last = playlist.pop();
      playlist.unshift(last);
      playQueueTop();
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", function () {
      if (playlist.length < 2) return;
      var first = playlist.shift();
      playlist.push(first);
      playQueueTop();
    });
  }

  /* 音量调节 */
  var volumeSlider = document.getElementById("audio-bar-volume");
  if (volumeSlider && audioEl) {
    audioEl.volume = (volumeSlider.value || 50) / 100;
    volumeSlider.addEventListener("input", function () {
      audioEl.volume = volumeSlider.value / 100;
    });
  }

  /* ---- 初始化 ---- */
  render();
})();
