'use client';

import { motion, type HTMLMotionProps, type Variants } from 'framer-motion';

const container: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } } };
const item: Variants = {
  hidden: { opacity: 0, y: 28, scale: 0.97 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 120, damping: 18 } },
};

export function StaggerList(props: HTMLMotionProps<'div'>) {
  return <motion.div variants={container} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-40px' }} {...props} />;
}

export function StaggerItem(props: HTMLMotionProps<'div'>) {
  return <motion.div variants={item} {...props} />;
}
