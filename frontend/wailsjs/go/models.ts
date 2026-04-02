export namespace contracts {
	
	export class CreateProjectInput {
	    name: string;
	    bindHost: string;
	    port: number;
	    upstreamBaseUrl?: string;
	    replaceActive: boolean;
	
	    static createFrom(source: any = {}) {
	        return new CreateProjectInput(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.bindHost = source["bindHost"];
	        this.port = source["port"];
	        this.upstreamBaseUrl = source["upstreamBaseUrl"];
	        this.replaceActive = source["replaceActive"];
	    }
	}
	export class GatewaySettings {
	    bindHost: string;
	    port: number;
	    autoStart: boolean;
	
	    static createFrom(source: any = {}) {
	        return new GatewaySettings(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.bindHost = source["bindHost"];
	        this.port = source["port"];
	        this.autoStart = source["autoStart"];
	    }
	}
	export class GatewayStateResponse {
	    state: string;
	    projectId?: string;
	
	    static createFrom(source: any = {}) {
	        return new GatewayStateResponse(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.state = source["state"];
	        this.projectId = source["projectId"];
	    }
	}
	export class HealthResponse {
	    status: string;
	
	    static createFrom(source: any = {}) {
	        return new HealthResponse(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.status = source["status"];
	    }
	}
	export class OpenPathRequest {
	    path: string;
	
	    static createFrom(source: any = {}) {
	        return new OpenPathRequest(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.path = source["path"];
	    }
	}
	export class ProjectSummary {
	    id: string;
	    name: string;
	    rootDir: string;
	    updatedAt?: string;
	    routesCount: number;
	
	    static createFrom(source: any = {}) {
	        return new ProjectSummary(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.rootDir = source["rootDir"];
	        this.updatedAt = source["updatedAt"];
	        this.routesCount = source["routesCount"];
	    }
	}
	export class ProjectsOverview {
	    active?: ProjectSummary;
	    archived: ProjectSummary[];
	
	    static createFrom(source: any = {}) {
	        return new ProjectsOverview(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.active = this.convertValues(source["active"], ProjectSummary);
	        this.archived = this.convertValues(source["archived"], ProjectSummary);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class RestoreProjectRequest {
	    id: string;
	
	    static createFrom(source: any = {}) {
	        return new RestoreProjectRequest(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	    }
	}
	export class SetGatewaySettingsRequest {
	    bindHost: string;
	    port: number;
	
	    static createFrom(source: any = {}) {
	        return new SetGatewaySettingsRequest(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.bindHost = source["bindHost"];
	        this.port = source["port"];
	    }
	}
	export class Settings {
	    schemaVersion: number;
	    themePreference: string;
	    gateway: GatewaySettings;
	    upstreamBaseUrl?: string;
	    lastActiveProjectPath?: string;
	    lastActiveView?: string;
	
	    static createFrom(source: any = {}) {
	        return new Settings(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.schemaVersion = source["schemaVersion"];
	        this.themePreference = source["themePreference"];
	        this.gateway = this.convertValues(source["gateway"], GatewaySettings);
	        this.upstreamBaseUrl = source["upstreamBaseUrl"];
	        this.lastActiveProjectPath = source["lastActiveProjectPath"];
	        this.lastActiveView = source["lastActiveView"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}

}

