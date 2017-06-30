import common from './common';

class AsyncA {

	get common() {
		return common;
	}
}

export default new AsyncA();