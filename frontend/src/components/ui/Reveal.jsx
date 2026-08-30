import { motion } from 'framer-motion'

/**
 * Reveal — wrapper d'animation au scroll standardisé pour tout le site.
 *
 * Pourquoi ce composant existe :
 * - Centralise les réglages qui évitent le "clignotement" (once: true, amount raisonnable)
 * - Évite de dupliquer initial/whileInView/viewport partout et d'introduire des incohérences
 * - `viewport.once` est TOUJOURS true ici : une section ne s'anime qu'une seule fois par visite,
 *   jamais en boucle au re-scroll.
 *
 * Usage :
 *   <Reveal><h2>Titre</h2></Reveal>
 *   <Reveal delay={0.1} y={30}><Card /></Reveal>
 *   <Reveal direction="right"><Sidebar /></Reveal>
 */
export default function Reveal({
  children,
  as = 'div',
  delay = 0,
  duration = 0.55,
  y = 28,
  direction = 'up', // 'up' | 'down' | 'left' | 'right' | 'none'
  amount = 0.2,
  className = '',
  ...rest
}) {
  const MotionTag = motion[as] || motion.div

  const offsets = {
    up: { y, x: 0 },
    down: { y: -y, x: 0 },
    left: { y: 0, x: y },
    right: { y: 0, x: -y },
    none: { y: 0, x: 0 },
  }
  const { y: initY, x: initX } = offsets[direction] || offsets.up

  return (
    <MotionTag
      initial={{ opacity: 0, y: initY, x: initX }}
      whileInView={{ opacity: 1, y: 0, x: 0 }}
      viewport={{ once: true, amount }}
      transition={{ duration, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
      {...rest}
    >
      {children}
    </MotionTag>
  )
}

/**
 * RevealGroup — anime un ensemble d'enfants en cascade (stagger) EN UNE SEULE
 * observation de viewport (sur le conteneur), au lieu d'observer chaque enfant
 * séparément. Ça élimine le risque de désynchronisation / clignotement perçu
 * quand plusieurs cartes ont des seuils de déclenchement légèrement différents.
 *
 * Usage :
 *   <RevealGroup className="grid grid-cols-4 gap-6" stagger={0.08}>
 *     {items.map(item => <Card key={item.id} {...item} />)}
 *   </RevealGroup>
 */
export function RevealGroup({
  children,
  className = '',
  stagger = 0.08,
  amount = 0.15,
  y = 24,
  ...rest
}) {
  const container = {
    hidden: {},
    visible: {
      transition: { staggerChildren: stagger },
    },
  }

  return (
    <motion.div
      className={className}
      variants={container}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount }}
      {...rest}
    >
      {Array.isArray(children)
        ? children.map((child, i) => (
            <RevealItem key={child?.key ?? i} y={y}>
              {child}
            </RevealItem>
          ))
        : children}
    </motion.div>
  )
}

function RevealItem({ children, y = 24 }) {
  const item = {
    hidden: { opacity: 0, y },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
  }
  return <motion.div variants={item}>{children}</motion.div>
}
