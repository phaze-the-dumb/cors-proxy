export default {
	async fetch(request, env, ctx): Promise<Response> {
		let url = new URL(request.url);

		let urlToProxy = url.searchParams.get("url");

		if(!urlToProxy)
				return new Response("Invalid URL", { status: 400 });

		if(request.method === "OPTIONS"){
			return new Response("200 OK", { headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "*", "Access-Control-Allow-Method": "*" } })
		}

		let urlHostname = new URL(urlToProxy);
		let proxyHeaders: any = {};

		request.headers.forEach((val, key) => {
			proxyHeaders[key] = val;
		})

		proxyHeaders["host"] = urlHostname.host;

		let proxy;

		if(request.method === "PUT" || request.method === "POST"){
			let body = await request.text();
			proxy = await fetch(urlToProxy, { method: request.method, headers: proxyHeaders, body });
		} else
			proxy = await fetch(urlToProxy, { method: request.method, headers: proxyHeaders });


		let proxyResHeaders: any = {};

		proxy.headers.forEach((val, key) => {
			if(key === "access-control-allow-origin")return;
			proxyResHeaders[key] = val;
		})

		proxyResHeaders["access-control-allow-origin"] = request.headers.get("origin");
		proxyResHeaders["access-control-allow-headers"] = "*";
		proxyResHeaders["access-control-allow-method"] = "*";

		if(proxyHeaders["content-type"] && (proxyHeaders["content-type"].includes("image") || proxyHeaders["content-type"].includes("video"))){
			let body = await proxy.arrayBuffer();

			return new Response(body, { status: proxy.status, headers: proxyResHeaders });
		} else{
			let body = await proxy.text();

			body = body.replaceAll('https://', "https://cors-proxy.phaze.workers.dev/?url=https://")

			return new Response(body, { status: proxy.status, headers: proxyResHeaders });
		}
	},
} satisfies ExportedHandler<Env>;
