import React, { useEffect } from "react"
import { motion, useMotionValue, useAnimation, useViewportScroll } from "framer-motion"
import { useInView } from "react-intersection-observer"

const TypescriptInfo = () => {
	const contentOffsetY = useMotionValue(0)
	const controlh1 = useAnimation()
	const controlp = useAnimation()
	const [ref, inView] = useInView()
	const [refp, inViewp] = useInView()
	const { scrollYProgress } = useViewportScroll()
	useEffect(() => {
		console.log(scrollYProgress)
	}, [scrollYProgress])
	useEffect(() => {
		if (inView) {
			controlh1.start("visible")
		} else {
			controlh1.start("hidden")
		}
		inViewp ? controlp.start({ translateX: 0, opacity: 1 }) : controlp.start({ translateY: 100, opacity: 0 })
	}, [controlh1, controlp, inView, inViewp])
	const boxVariant = {
		visible: { translateX: 0, opacity: 1 },
		hidden: { translateX: 100, opacity: 0 },
	}
	return (
		<div>
			<div className="flex items-end justify-center h-screen text-center">
				<motion.h1
					ref={ref}
					initial={"hidden"}
					// animate={{ translateX: 0, opacity: 1 }}
					variants={boxVariant}
					animate={controlh1}
					transition={{ delay: 0.2 }}
					className=""
					style={{ textAlign: "right" }}
				>
					LOL, duh! We Wrote it <i>Completely</i> in TypeScript!
				</motion.h1>
			</div>
			<div className="flex items-center justify-center h-screen">
				<motion.p
					ref={refp}
					initial={{ translateX: 100, opacity: 0 }}
					// animate={{ translateX: 0, opacity: 1 }}
					animate={controlp}
					transition={{ delay: 0.1 }}
				>
					Because we wrote Plexus in TypeScript, it comes with full type safty & intellesense. Have Fun! 🎉
				</motion.p>
			</div>
		</div>
	)
}

export default TypescriptInfo
