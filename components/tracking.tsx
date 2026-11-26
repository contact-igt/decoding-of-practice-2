'use client';

import { useEffect, useState } from 'react';
import { attribution, savedConsent, setSavedConsent, track } from '../lib/analytics';

const gtmId = process.env.NEXT_PUBLIC_DOP_GTM_ID ?? '';
const enabled = /^GTM-[A-Z0-9]{4,12}$/.test(gtmId);
let pageTracked = false;

function consent(granted: boolean, command: 'default' | 'update' = 'update') {
  function pushConsent(...values: [string, string, Record<string, string>]) {
    // GTM's command queue expects the arguments object used by the gtag API.
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer?.push(arguments);
    return values.length;
  }
  window.dataLayer ||= [];
  const value = granted ? 'granted' : 'denied';
  pushConsent('consent', command, { analytics_storage: value, ad_storage: value, ad_user_data: 'denied', ad_personalization: 'denied' });
}

function enableContainer() {
  if (document.getElementById('vls-approved-gtm')) {
    consent(true);
    return;
  }
  // Drop interactions that happened before consent. Start the authorised
  // container with a clean buffer and a fresh page-view event.
  window.dataLayer = [];
  consent(true, 'default');
  track('gtm.js', { 'gtm.start': Date.now() });
  const script = document.createElement('script');
  script.id = 'vls-approved-gtm';
  script.async = true;
  script.src = 'https://www.googletagmanager.com/gtm.js?id=' + gtmId;
  document.head.append(script);
}

export function Tracking({ variant, trackPage = true }: { variant: string; trackPage?: boolean }) {
  const [preference, setPreference] = useState<boolean | null>(null);
  useEffect(() => {
    attribution();
    const granted = savedConsent();
    if (enabled && granted) enableContainer();
    if (!pageTracked && trackPage && (!enabled || granted)) {
      track('page_view', { variant });
      pageTracked = true;
    }

    let toggleReady = false;
    const observe = new IntersectionObserver(entries => {
      if (!entries.some(entry => entry.isIntersecting)) return;
      track('curriculum_view', { variant });
      observe.disconnect();
    }, { threshold: 0.15 });
    const curriculum = document.getElementById('curriculum');
    if (curriculum) observe.observe(curriculum);
    const admission = document.getElementById('admission');
    const sticky = document.querySelector<HTMLAnchorElement>('.mobile-cta');
    const heroAction = document.querySelector('.hero .button');
    const targetsInView = new Map<Element, boolean>();
    const stickyObserver = new IntersectionObserver(entries => {
      for (const entry of entries) targetsInView.set(entry.target, entry.isIntersecting);
      sticky?.classList.toggle('mobile-cta-active', targetsInView.size === 2 && ![...targetsInView.values()].some(Boolean));
    });
    if (admission && heroAction) {
      stickyObserver.observe(admission);
      stickyObserver.observe(heroAction);
    }

    const menu = document.querySelector<HTMLDetailsElement>('.mobile-nav');
    function click(event: MouseEvent) {
      if (!(event.target instanceof Element)) return;
      const link = event.target.closest<HTMLElement>('[data-track]');
      if (link?.dataset.track) track(link.dataset.track, { variant, placement: link.dataset.placement ?? 'page' });
      if (menu?.open && (menu.contains(event.target.closest('nav a')) || !menu.contains(event.target))) menu.open = false;
    }
    function escape(event: KeyboardEvent) {
      if (event.key === 'Escape' && menu?.open) {
        menu.open = false;
        menu.querySelector('summary')?.focus();
      }
    }
    function toggle(event: Event) {
      const item = event.target;
      if (toggleReady && item instanceof HTMLDetailsElement && item.open && item.dataset.trackToggle) {
        track(item.dataset.trackToggle, { variant, item: item.dataset.item ?? '' });
      }
    }
    function play(event: Event) {
      const video = event.target;
      if (video instanceof HTMLVideoElement && video.dataset.trackVideo) track(video.dataset.trackVideo, { variant });
    }
    const frame = requestAnimationFrame(() => { toggleReady = true; });
    document.addEventListener('click', click);
    document.addEventListener('keydown', escape);
    document.addEventListener('toggle', toggle, true);
    document.addEventListener('play', play, true);
    return () => {
      observe.disconnect();
      stickyObserver.disconnect();
      cancelAnimationFrame(frame);
      document.removeEventListener('click', click);
      document.removeEventListener('keydown', escape);
      document.removeEventListener('toggle', toggle, true);
      document.removeEventListener('play', play, true);
    };
  }, [trackPage, variant]);

  if (!enabled) return null;
  function setChoice(granted: boolean) {
    setPreference(granted);
    setSavedConsent(granted);
    if (granted) {
      enableContainer();
      if (trackPage && !pageTracked) track('page_view', { variant });
      pageTracked = trackPage;
    } else if (document.getElementById('vls-approved-gtm')) {
      consent(false);
      location.reload();
    }
  }
  return <aside className="tracking-preferences" aria-label="Analytics preferences">
    <details><summary>Analytics preferences</summary>
      <p>Allow optional measurement of programme and campaign activity.</p>
      <button type="button" className="button" onClick={() => setChoice(true)}>Allow Analytics</button>
      <button type="button" className="text-link" onClick={() => setChoice(false)}>Use Essential Only</button>
      <p role="status">{preference === null ? '' : preference ? 'Analytics allowed.' : 'Essential only.'}</p>
    </details>
  </aside>;
}
