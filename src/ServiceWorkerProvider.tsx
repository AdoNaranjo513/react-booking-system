import React, {Component, ComponentClass, createContext, FunctionComponent, ReactNode, StatelessComponent} from 'react';
import {STATUS as WORKER_STATUS} from './registerServiceWorker';

export interface IWithServiceWorker {
	serviceWorkerState: WORKER_STATUS | undefined;
	serviceWorkerUpdate: (() => void) | undefined;
}

interface IProps {
	children: ReactNode;
}

const initialContext: IWithServiceWorker = {
	serviceWorkerState: undefined,
	serviceWorkerUpdate: undefined,
};

const WorkerContext = createContext<IWithServiceWorker>(initialContext);

export const ServiceWorkerConsumer = WorkerContext.Consumer;
const Provider = WorkerContext.Provider;

export function withServiceWorker<P extends IWithServiceWorker>(
	WrappedComponent: ComponentClass<P> | StatelessComponent<P>,
): FunctionComponent<Omit<P, keyof IWithServiceWorker>> {
	return function Wrapper(props: P) {
		return <ServiceWorkerConsumer>{(value) => <WrappedComponent {...props} {...value} />}</ServiceWorkerConsumer>;
	};
}

export class ServiceWorkerProvider extends Component<IProps, IWithServiceWorker> {
	constructor(props: IProps) {
		super(props);
		this.state = initialContext;
		this.onServiceStateChange = this.onServiceStateChange.bind(this);
		this.runUpdate = this.runUpdate.bind(this);
		this.getUpdateFunction = this.getUpdateFunction.bind(this);
	}
	public componentDidMount() {
		import('./registerServiceWorker' /* webpackChunkName: "register-service-worker" */).then((registerServiceWorker) =>
			registerServiceWorker.default(this.onServiceStateChange, this.getUpdateFunction),
		);
	}
	public render() {
		const contextValue: IWithServiceWorker = {
			serviceWorkerState: this.state.serviceWorkerState,
			serviceWorkerUpdate: this.runUpdate,
		};
		return <Provider value={contextValue}>{this.props.children}</Provider>;
	}
	private onServiceStateChange(state: WORKER_STATUS) {
		this.setState({
			serviceWorkerState: state,
		});
	}
	private getUpdateFunction(callback: () => void) {
		this.setState({
			serviceWorkerUpdate: callback,
		});
	}
	private runUpdate() {
		if (this.state.serviceWorkerUpdate) {
			this.state.serviceWorkerUpdate();
		}
	}
}
