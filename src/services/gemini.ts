import { GoogleGenAI, Type } from "@google/genai";
import { WorldData, MapStyle } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const STYLE_PROMPTS: Record<MapStyle, string> = {
  parchment: "(High-detail fantasy map on aged vellum:1.2), exquisite ink line art, Tolkien style, hand-drawn mountains and forests, deep shadows, intricate compass rose, vintage calligraphy, sepia tones, cinematic lighting, 8k resolution, texture of old paper.",
  watercolor: "(Cinematic fantasy landscape map:1.3), vibrant watercolor wash, atmospheric mist between mountain peaks, glowing magic ley lines, golden hour lighting, bird's eye view, epic scale, hyper-realistic terrain textures, ethereal glow, high fantasy aesthetic.",
  lineart: "(High-detail fantasy map:1.2), crisp black and white line art, D&D style, precise cartography, intricate topographic details, stippling shading, compass rose, grid lines, clear borders, 8k resolution."
};

const POV_STYLE_PROMPTS: Record<MapStyle, string> = {
  parchment: "Vintage hand-drawn sketch, sepia ink, fantasy concept art, highly detailed, rough paper texture, classic RPG style.",
  watercolor: "Cinematic watercolor painting, vibrant, atmospheric lighting, fantasy concept art, ethereal glow, masterpiece.",
  lineart: "Crisp black and white line art, intricate details, fantasy concept art, precise shading, D&D manual illustration style."
};

const WORLD_DATA_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    worldOverview: { type: Type.STRING },
    architectLog: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          concept: { type: Type.STRING },
          deduction: { type: Type.STRING }
        },
        required: ["concept", "deduction"]
      }
    },
    imagePrompt: { type: Type.STRING },
    narrativeAnchors: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          location: { type: Type.STRING },
          description: { type: Type.STRING }
        },
        required: ["name", "location", "description"]
      }
    },
    ocResidence: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING },
        description: { type: Type.STRING }
      },
      required: ["name", "description"]
    },
    epicIntro: { type: Type.STRING },
    ecology: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          location: { type: Type.STRING },
          description: { type: Type.STRING },
          type: { type: Type.STRING }
        },
        required: ["name", "location", "description", "type"]
      }
    },
    tradeRoutes: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          path: { type: Type.STRING },
          description: { type: Type.STRING },
          goods: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        },
        required: ["name", "path", "description", "goods"]
      }
    }
  },
  required: ["worldOverview", "architectLog", "imagePrompt", "narrativeAnchors", "ocResidence", "epicIntro", "ecology", "tradeRoutes"]
};

export async function generateRandomOC(): Promise<string> {
  const prompt = `请生成一个简短、有创意且充满西幻色彩的原创角色(OC)设定。
要求：
1. 包含职业、性格、特殊武器或道具、以及一个执念或目标。
2. 字数在50-150字之间。
3. 风格偏向史诗、神秘或黑暗奇幻。
4. 直接返回设定文本，不要有任何多余的解释、前缀或引号。`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
  });

  return response.text || '一名流浪的剑客，带着一把断剑，寻找着失落的故乡。';
}

export async function generateWorldData(ocDescription: string): Promise<WorldData> {
  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: `用户 OC 描述：\n${ocDescription}`,
    config: {
      systemInstruction: `你是 MythosForge 的首席架构师，专门为 OC（原创角色）创作者服务。你的任务是将用户模糊的叙事词汇转化为具有严密地理逻辑和西幻美学的地图布局建议。

工作流程：
1. 语义解析： 从用户的 OC 描述中提取关键词（如：核心冲突、视觉奇观、叙事重心等）。
2. 地理推演： 记录你的推演过程（架构师日志）。例如：“魔法不稳定 -> 地形不应连贯，采用群岛结构”。
3. 视觉风格引导： 自动匹配一种西幻风格，并生成精细的图像 Prompt。

输出格式必须是 JSON，包含以下字段：
- worldOverview: 一句话描述这个世界的基调。
- architectLog: 架构师日志，包含 3-4 个推演条目（concept: 提取的概念，deduction: 推演出的地理特征）。
- imagePrompt: 供图像生成模型使用的精细 Prompt（英文，包含光影、材质、构图，描述地图本身的画面内容，如山脉、森林、河流、城市的位置和外观）。
- narrativeAnchors: 3-5 个推荐的标志性地标，包含名称、大致方位（location，如“左上角”、“中心”）以及为何适合该 OC 的描述。
- ocResidence: OC 居住地智能匹配（包含名称和推演理由）。
- epicIntro: 一段具有史诗感的导语（如：“在那片被神明遗忘的荒原上，故事开始了...”）。
- ecology: 动植物图鉴。根据地形（如高魔、高寒、深海），自动生成该地区的特色生物（3-4个）。例如在“晶簇森林”里标注“发光的透明鹿”。包含名称、位置、描述和类型（flora/fauna）。
- tradeRoutes: 贸易路线图。自动连接各大城市，生成商贸路径（2-3条），并标注：“这里是全大陆最大的香料集散地”。包含路线名称、路径描述、路线说明和主要货物。`,
      responseMimeType: "application/json",
      responseSchema: WORLD_DATA_SCHEMA
    }
  });

  const text = response.text;
  if (!text) throw new Error("Failed to generate world data");
  return JSON.parse(text) as WorldData;
}

export async function evolveWorldData(previousData: WorldData, eventDescription: string): Promise<WorldData> {
  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: `前一纪元世界状态：\n${JSON.stringify(previousData, null, 2)}\n\n发生的历史事件：\n${eventDescription}`,
    config: {
      systemInstruction: `你是 MythosForge 的首席架构师。你的任务是根据“前一纪元的世界状态”和“新发生的历史事件”，推演出世界演变后的新状态。

工作流程：
1. 语义解析： 分析历史事件对地理、气候、魔法阵营的破坏或重塑作用。
2. 地理推演： 记录推演过程（架构师日志）。例如：“巨大海啸 -> 淹没低海拔地区，海岸线后退，原有的沿海城市变为海底遗迹”。
3. 状态更新： 在前一纪元的基础上，更新世界总览、图像Prompt、叙事锚点和OC居住地。必须保留未受影响的设定，修改受影响的设定。

输出格式必须是 JSON，字段与前一纪元完全一致：
- worldOverview: 演变后的世界基调。
- architectLog: 针对此次演变的 3-4 个推演条目。
- imagePrompt: 演变后的精细 Prompt（必须体现出地形/环境的变化，如“淹没的废墟”、“新生的火山”等）。
- narrativeAnchors: 更新后的地标（旧地标可能毁灭或改变，也可能出现新地标）。
- ocResidence: OC 居住地的现状（如果被毁，OC可能被迫迁移）。
- epicIntro: 描述这一新纪元的史诗导语。
- ecology: 演变后的动植物图鉴。旧物种可能灭绝或变异，新物种可能诞生。
- tradeRoutes: 演变后的贸易路线图。旧路线可能因为灾难阻断，新路线可能开辟。`,
      responseMimeType: "application/json",
      responseSchema: WORLD_DATA_SCHEMA
    }
  });

  const text = response.text;
  if (!text) throw new Error("Failed to evolve world data");
  return JSON.parse(text) as WorldData;
}

export async function generateMapImage(imagePrompt: string, style: MapStyle): Promise<string> {
  const fullPrompt = `${STYLE_PROMPTS[style]} ${imagePrompt}`;
  
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        { text: fullPrompt }
      ]
    },
    config: {
      imageConfig: {
        aspectRatio: "16:9",
        imageSize: "1K"
      }
    }
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }

  throw new Error("Failed to generate map image");
}

export async function generatePOVImage(
  locationName: string,
  locationDesc: string,
  style: MapStyle,
  ocImageBase64?: string,
  ocMimeType?: string
): Promise<string> {
  const prompt = `A ground-level POV scene (like a street view, landscape, or interior) of a fantasy location named "${locationName}". Description: ${locationDesc}. ${POV_STYLE_PROMPTS[style]}`;

  const parts: any[] = [];
  if (ocImageBase64 && ocMimeType) {
    parts.push({
      inlineData: {
        data: ocImageBase64,
        mimeType: ocMimeType
      }
    });
    parts.push({
      text: `Render the character from the provided image seamlessly integrated into this environment: ${prompt}. Ensure the character matches the lighting and style of the environment.`
    });
  } else {
    parts.push({ text: prompt });
  }

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: { parts },
    config: {
      imageConfig: {
        aspectRatio: "16:9",
      }
    }
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
    }
  }
  throw new Error("No image generated");
}
