/**
 * GSAP singleton — import this instead of 'gsap' directly so the
 * ScrollTrigger plugin is always registered before use.
 */
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

export { gsap, ScrollTrigger }
