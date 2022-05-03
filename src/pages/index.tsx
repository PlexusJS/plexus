import React from "react"
import clsx from "clsx"
import Layout from "@theme/Layout"
import Link from "@docusaurus/Link"
import useDocusaurusContext from "@docusaurus/useDocusaurusContext"
import styles from "./index.module.css"
import HomepageFeatures from "@site/src/components/HomepageFeatures"

function HomepageHeader() {
	const { siteConfig } = useDocusaurusContext()
	return (
		<header className={`flex flex-col items-center justify-center w-full transition-all duration-75`}>
			<div className="container w-full">
				<img src="/img/TransparentLogo.svg" />

				<div className={styles.buttons}>
					<Link className="button button--secondary button--lg" to="/docs/intro">
						Docs
					</Link>
				</div>
			</div>
		</header>
	)
}

export default function Home(): JSX.Element {
	const { siteConfig } = useDocusaurusContext()
	return (
		<Layout title={`Home`} description="The Home">
			<HomepageHeader />
			<main>
				<HomepageFeatures />
			</main>
		</Layout>
	)
}
