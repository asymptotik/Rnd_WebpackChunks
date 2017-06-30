class Index {
	constructor() {
		setTimeout(() => this.loada(), 1000);
		setTimeout(() => this.loadb(), 2000);
	}

	loada() {
		import(/* webpackChunkName: "async-a" */ './async-a').then(module => module.default.common.sayHello());
	}

	loadb() {
		import(/* webpackChunkName: "async-b" */ './async-b').then(module => module.default.common.sayHello());
	}
}

export default new Index();