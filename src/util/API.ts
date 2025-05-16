import OpenAI from 'openai';

type APIResponse<T> = {
    data: T,
    status: number,
    error?: string
}

abstract class API {

    BASE_URL = '';

    constructor(baseUrl: string) {
        this.BASE_URL = baseUrl;
    }

    //eslint-disable-next-line
    abstract request<T>(endpoint: string, data: Record<string, any>, method: 'PATCH' | 'POST' | 'GET' | 'DELETE'): Promise<APIResponse<T | undefined>>;

    abstract transcribe(audioFile: Blob): Promise<APIResponse<string>>;
    
}


class ServerlessAPI extends API {

    //eslint-disable-next-line
    async request<T>(endpoint: string, data: Record<string, any>, method: 'PATCH' | 'POST' | 'GET' | 'DELETE'): Promise<APIResponse<T | undefined>> {

        let url: URL;
        if(endpoint.includes('http')) {
            url = new URL(endpoint);
        } else {
            url = new URL(endpoint, this.BASE_URL);
        }
        
        let dataStr;

        if(method === 'GET' || method === 'DELETE') {
            for(const [key, value] of Object.entries(data)) {
                if(typeof value === 'object') {
                    throw new Error('Cannot set object as search param');
                }
                url.searchParams.set(key, value);
            }
        } else {
            dataStr = JSON.stringify(data);
        }

        const res = await fetch(url, {
            method,
            body: dataStr
        })

        if(res.status !== 200) {
            return {
                data: undefined,
                status: res.status,
                error: 'An unknown error occured'
            }
        }

        const responseData = await res.json();

        return {
            data: responseData,
            status: res.status
        }
    }

    async transcribe(audioFile: Blob): Promise<APIResponse<string>> {
        // const fileURL = URL.createObjectURL(audioFile);
        const openAI = new OpenAI({
            apiKey: import.meta.env.VITE_PUBLIC_OPENAI_SECRET_KEY,
            dangerouslyAllowBrowser: true
        });
        const file = new File([audioFile], 'audio.mp3');
        const res = await openAI.audio.transcriptions.create({
            file,
            stream: false,
            model: 'whisper-1'
        });

        const data = res.text;

        return {
            data,
            status: 200
        }
    }

}

const api = new ServerlessAPI('');

export default api;