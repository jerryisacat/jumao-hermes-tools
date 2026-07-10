(function () {
  'use strict';

  var slug = window.location.pathname.replace(/^\/talks\/|\/$/g, '');
  if (!slug) return;

  var sessionId = null;
  var slideTimers = {};
  var slideSeen = {};
  var slideViewSent = {};
  var pageStart = Date.now();

  function postEvent(endpoint, extra) {
    fetch('/api/events/' + endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      keepalive: true,
      body: JSON.stringify(Object.assign({ presentation_slug: slug, session_id: sessionId }, extra || {})),
    }).catch(function () {});
  }

  function findSlides() {
    return Array.prototype.slice.call(document.querySelectorAll('section.slide'));
  }

  function observeSlides() {
    var slides = findSlides();
    slides.forEach(function (slide, idx) {
      if (slideSeen[idx]) return;
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            slideSeen[idx] = true;
            slideTimers[idx] = Date.now();
            observer.unobserve(slide);
          }
        });
      }, { threshold: 0.5 });
      observer.observe(slide);
    });
  }

  function startSession() {
    fetch('/api/events/page-view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ presentation_slug: slug, ua: navigator.userAgent }),
    }).then(function (r) { return r.json(); }).then(function (body) {
      if (body.data && body.data.session_id) {
        sessionId = body.data.session_id;
        if ('IntersectionObserver' in window) {
          observeSlides();
          setInterval(reportSlideViews, 3000);
        }
      }
    }).catch(function () {});
  }

  function reportSlideViews() {
    Object.keys(slideTimers).forEach(function (idx) {
      var timer = slideTimers[idx];
      if (timer && !slideViewSent[idx]) {
        var dur = Date.now() - timer;
        if (dur > 1000) {
          postEvent('slide-view', { slide_index: parseInt(idx, 10), duration_ms: dur });
          slideViewSent[idx] = true;
        }
      }
    });
  }

  function endSession() {
    if (!sessionId) return;
    var totalMs = Date.now() - pageStart;
    var slides = findSlides();
    var slideCountSeen = Object.keys(slideSeen).length;
    var completion = slides.length > 0 ? slideCountSeen / slides.length : 0;
    postEvent('session-end', {
      total_duration_ms: totalMs,
      slide_count_seen: slideCountSeen,
      completion_rate: Math.round(completion * 100) / 100,
    });
  }

  window.addEventListener('pagehide', endSession);
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') endSession();
  });

  startSession();
})();
