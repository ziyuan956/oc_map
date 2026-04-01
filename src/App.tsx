/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import * as htmlToImage from 'html-to-image';
import { Map, ScrollText, Wand2, Compass, MapPin, BookOpen, Loader2, Download, BrainCircuit, ArrowRight, Terminal, History, Sparkles, Leaf, Route, Package, Camera, Eye, X, Dices } from 'lucide-react';
import { generateWorldData, generateMapImage, evolveWorldData, generatePOVImage, generateRandomOC } from './services/gemini';
import { MapStyle, ChronicleEra, POVImage } from './types';

export default function App() {
  const [ocDescription, setOcDescription] = useState('我是一名研究不稳定魔法的法师，毕生都在寻找传说中沉没的白塔。我的法杖上镶嵌着会共鸣的浮空晶体，性格孤僻，喜欢在最接近星辰的地方观测天象。');
  const [selectedStyle, setSelectedStyle] = useState<MapStyle>('watercolor');
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  
  // OC Image State
  const [ocImage, setOcImage] = useState<{ base64: string; mimeType: string } | null>(null);

  // POV State
  const [povLoading, setPovLoading] = useState<string | null>(null);
  const [povResult, setPovResult] = useState<POVImage | null>(null);
  const [savedPOVs, setSavedPOVs] = useState<POVImage[]>([]);

  // Chronicle State
  const [chronicles, setChronicles] = useState<ChronicleEra[]>([]);
  const [activeEraIndex, setActiveEraIndex] = useState(0);
  const [newEventDescription, setNewEventDescription] = useState('100年后发生了巨大的海啸，淹没了低洼地区');
  const [isEvolving, setIsEvolving] = useState(false);

  const [showBookModal, setShowBookModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isGeneratingOC, setIsGeneratingOC] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  const handleRandomOC = async () => {
    setIsGeneratingOC(true);
    try {
      const randomOC = await generateRandomOC();
      setOcDescription(randomOC);
    } catch (error) {
      console.error('Failed to generate random OC:', error);
      alert('随机生成失败，请稍后重试。');
    } finally {
      setIsGeneratingOC(false);
    }
  };

  const handleGenerate = async () => {
    if (!ocDescription.trim()) return;
    
    setIsGenerating(true);
    setChronicles([]);
    
    try {
      setLoadingStep('正在推演世界观...');
      const worldData = await generateWorldData(ocDescription);
      
      setLoadingStep('正在绘制地图...');
      const imageUrl = await generateMapImage(worldData.imagePrompt, selectedStyle);
      
      const newEra: ChronicleEra = {
        id: Date.now().toString(),
        eraName: '第一纪元',
        eventDescription: '创世之初',
        worldData,
        imageUrl
      };
      
      setChronicles([newEra]);
      setActiveEraIndex(0);
    } catch (error) {
      console.error('Generation failed:', error);
      alert('生成失败，请稍后重试。');
    } finally {
      setIsGenerating(false);
      setLoadingStep('');
    }
  };

  const handleEvolve = async () => {
    if (!newEventDescription.trim() || chronicles.length === 0) return;
    
    setIsEvolving(true);
    const prevEra = chronicles[chronicles.length - 1];
    
    try {
      setLoadingStep('正在推演历史变迁...');
      const newWorldData = await evolveWorldData(prevEra.worldData, newEventDescription);
      
      setLoadingStep('正在绘制新纪元地图...');
      const newImageUrl = await generateMapImage(newWorldData.imagePrompt, selectedStyle);
      
      const eraNames = ['第一纪元', '第二纪元', '第三纪元', '第四纪元', '第五纪元', '第六纪元', '第七纪元'];
      const newEra: ChronicleEra = {
        id: Date.now().toString(),
        eraName: eraNames[chronicles.length] || `第${chronicles.length + 1}纪元`,
        eventDescription: newEventDescription,
        worldData: newWorldData,
        imageUrl: newImageUrl
      };
      
      const updatedChronicles = [...chronicles, newEra];
      setChronicles(updatedChronicles);
      setActiveEraIndex(updatedChronicles.length - 1);
      setNewEventDescription('');
    } catch (error) {
      console.error('Evolution failed:', error);
      alert('演变失败，请稍后重试。');
    } finally {
      setIsEvolving(false);
      setLoadingStep('');
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      setOcImage({ base64, mimeType: file.type });
    };
    reader.readAsDataURL(file);
  };

  const handleGeneratePOV = async (anchor: { name: string; description: string }) => {
    setPovLoading(anchor.name);
    try {
      const imageUrl = await generatePOVImage(
        anchor.name,
        anchor.description,
        selectedStyle,
        ocImage?.base64,
        ocImage?.mimeType
      );
      const newPov: POVImage = {
        id: Date.now().toString(),
        name: anchor.name,
        imageUrl,
        timestamp: Date.now()
      };
      setPovResult(newPov);
      setSavedPOVs(prev => [newPov, ...prev]);
    } catch (error) {
      console.error('POV generation failed:', error);
      alert('切片生成失败，请稍后重试。');
    } finally {
      setPovLoading(null);
    }
  };

  const handleExport = async () => {
    if (!exportRef.current || !activeEra) return;
    setIsExporting(true);
    try {
      const url = await htmlToImage.toPng(exportRef.current, {
        backgroundColor: '#0a0a0a',
        pixelRatio: 2,
      });
      const a = document.createElement('a');
      a.href = url;
      a.download = `MythosForge-${activeEra.eraName}.png`;
      a.click();
    } catch (error) {
      console.error('Export failed:', error);
      alert('导出长图失败，请重试。');
    } finally {
      setIsExporting(false);
    }
  };

  const activeEra = chronicles[activeEraIndex];

  const styles: { id: MapStyle; name: string; icon: React.ReactNode; desc: string }[] = [
    { id: 'parchment', name: '古朴史诗', icon: <ScrollText className="w-6 h-6" />, desc: '托尔金手绘风，羊皮纸质感' },
    { id: 'watercolor', name: '梦幻彩绘', icon: <Wand2 className="w-6 h-6" />, desc: '大航海时代水彩，沉浸式光影' },
    { id: 'lineart', name: '硬核线稿', icon: <Map className="w-6 h-6" />, desc: 'D&D 跑团风格，精细地形' },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-neutral-200 selection:bg-amber-500/30">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/50 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Compass className="w-8 h-8 text-amber-500" />
            <h1 className="epic-title text-2xl font-bold tracking-wider text-white">MythosForge</h1>
          </div>
          <div className="flex items-center gap-4">
            {chronicles.length > 0 && (
              <button
                onClick={() => setShowExportModal(true)}
                className="px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/40 border border-amber-500/50 text-amber-400 font-medium transition-colors flex items-center gap-2 text-sm"
              >
                <Download className="w-4 h-4" />
                一键成书
              </button>
            )}
            <div className="text-sm text-neutral-400 font-medium tracking-widest uppercase hidden sm:block">
              OC Fantasy Map Generator
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Panel: Controls */}
          <div className="lg:col-span-4 space-y-8">
            <div className="glass-panel rounded-2xl p-6 space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h2 className="epic-title text-xl text-white flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-amber-500" />
                    你的 OC 设定
                  </h2>
                  <button
                    onClick={handleRandomOC}
                    disabled={isGeneratingOC}
                    className="text-xs flex items-center gap-1 px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-amber-400 transition-colors disabled:opacity-50"
                    title="AI 随机生成设定"
                  >
                    {isGeneratingOC ? <Loader2 className="w-3 h-3 animate-spin" /> : <Dices className="w-3 h-3" />}
                    随机生成
                  </button>
                </div>
                <p className="text-sm text-neutral-400 mb-4">
                  描述你的原创角色（性格、武器、阵营、魔法元素等），AI 将为你推演最适合的奇幻世界。
                </p>
                <textarea
                  value={ocDescription}
                  onChange={(e) => setOcDescription(e.target.value)}
                  placeholder="例如：一名落魄的精灵骑士，带着一把生锈的重剑，性格孤僻，擅长冰系魔法..."
                  className="w-full h-40 bg-black/40 border border-white/10 rounded-xl p-4 text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50 resize-none mb-4"
                />

                {/* OC Image Upload */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-neutral-300 flex items-center gap-2">
                    <Camera className="w-4 h-4 text-amber-500" />
                    上传 OC 形象 (可选)
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="oc-upload"
                    />
                    <label
                      htmlFor="oc-upload"
                      className="flex items-center justify-center w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl cursor-pointer hover:bg-white/5 transition-colors text-sm text-neutral-400 group"
                    >
                      {ocImage ? (
                        <span className="text-amber-400 flex items-center gap-2">
                          <Camera className="w-4 h-4" /> 已上传 OC 形象 (点击更换)
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <Camera className="w-4 h-4 opacity-50 group-hover:opacity-100" /> 点击上传图片，让 OC 降临世界
                        </span>
                      )}
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="epic-title text-xl text-white mb-4">视觉风格</h2>
                <div className="grid grid-cols-1 gap-3">
                  {styles.map((style) => (
                    <button
                      key={style.id}
                      onClick={() => setSelectedStyle(style.id)}
                      className={`flex items-center gap-4 p-4 rounded-xl border transition-all duration-200 ${
                        selectedStyle === style.id
                          ? 'bg-amber-500/10 border-amber-500/50 text-amber-400'
                          : 'bg-black/40 border-white/5 text-neutral-400 hover:bg-white/5 hover:border-white/20'
                      }`}
                    >
                      <div className={`p-2 rounded-lg ${selectedStyle === style.id ? 'bg-amber-500/20' : 'bg-white/5'}`}>
                        {style.icon}
                      </div>
                      <div className="text-left">
                        <div className="font-medium text-white">{style.name}</div>
                        <div className="text-xs opacity-70 mt-1">{style.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleGenerate}
                disabled={isGenerating || !ocDescription.trim()}
                className="w-full py-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-medium tracking-wide transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {loadingStep}
                  </>
                ) : (
                  <>
                    <Wand2 className="w-5 h-5" />
                    铸造世界
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Panel: Results */}
          <div className="lg:col-span-8">
            <AnimatePresence mode="wait">
              {activeEra ? (
                <motion.div
                  key={activeEra.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  {/* Map Image */}
                  <div className="glass-panel rounded-2xl overflow-hidden relative group">
                    <img
                      src={activeEra.imageUrl}
                      alt="Generated Fantasy Map"
                      className="w-full aspect-[16/9] object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                      <button 
                        onClick={() => setShowBookModal(true)}
                        className="bg-amber-500 hover:bg-amber-400 text-black px-6 py-2 rounded-full font-medium flex items-center gap-2 transition-colors"
                      >
                        <BookOpen className="w-4 h-4" />
                        一键成书
                      </button>
                    </div>
                  </div>

                  {/* Chronicle Timeline */}
                  <div className="glass-panel p-6 rounded-2xl space-y-4">
                    <h3 className="epic-title text-xl text-amber-500 border-b border-white/10 pb-2 flex items-center gap-2">
                      <History className="w-5 h-5" />
                      动态编年史 (Chronicle Timeline)
                    </h3>
                    
                    {/* Slider / Steps */}
                    <div className="relative flex items-center justify-between pt-4 pb-2 px-4">
                      <div className="absolute left-4 right-4 h-1 bg-white/10 top-1/2 -translate-y-1/2 z-0 rounded-full" />
                      {chronicles.map((era, idx) => (
                        <button
                          key={era.id}
                          onClick={() => setActiveEraIndex(idx)}
                          className={`relative z-10 flex flex-col items-center gap-2 transition-all ${activeEraIndex === idx ? 'scale-110' : 'opacity-50 hover:opacity-100'}`}
                        >
                          <div className={`w-5 h-5 rounded-full border-2 ${activeEraIndex === idx ? 'bg-amber-500 border-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.5)]' : 'bg-[#1a1a1a] border-neutral-500'}`} />
                          <span className={`text-xs font-medium ${activeEraIndex === idx ? 'text-amber-400' : 'text-neutral-400'}`}>{era.eraName}</span>
                        </button>
                      ))}
                    </div>

                    {/* Event Description of Active Era */}
                    <div className="text-center text-sm text-neutral-300 italic py-2">
                      "{activeEra.eventDescription}"
                    </div>

                    {/* Evolution Input (only at the latest era) */}
                    {activeEraIndex === chronicles.length - 1 && (
                      <div className="mt-4 pt-4 border-t border-white/10">
                        <div className="flex flex-col sm:flex-row gap-3">
                          <input
                            value={newEventDescription}
                            onChange={(e) => setNewEventDescription(e.target.value)}
                            placeholder="输入历史事件，例如：100年后发生了巨大的海啸..."
                            className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                          />
                          <button
                            onClick={handleEvolve}
                            disabled={isEvolving || !newEventDescription.trim()}
                            className="px-6 py-3 rounded-xl bg-amber-600/20 hover:bg-amber-600/40 border border-amber-500/50 text-amber-400 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 whitespace-nowrap"
                          >
                            {isEvolving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                            时代演变
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* World Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    <div className="glass-panel p-6 rounded-2xl space-y-4">
                      <h3 className="epic-title text-xl text-amber-500 border-b border-white/10 pb-2">世界总览</h3>
                      <p className="text-neutral-300 leading-relaxed">
                        {activeEra.worldData.worldOverview}
                      </p>
                      
                      <div className="mt-6">
                        <h3 className="epic-title text-xl text-amber-500 border-b border-white/10 pb-2 mb-4 flex items-center gap-2">
                          <MapPin className="w-5 h-5" />
                          OC 归属地
                        </h3>
                        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
                          <div className="font-bold text-amber-400 text-lg mb-1">{activeEra.worldData.ocResidence.name}</div>
                          <div className="text-sm text-amber-200/70 leading-relaxed">
                            {activeEra.worldData.ocResidence.description}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="glass-panel p-6 rounded-2xl space-y-4">
                      <h3 className="epic-title text-xl text-amber-500 border-b border-white/10 pb-2">视觉构图预览 (叙事锚点)</h3>
                      <div className="space-y-4">
                        {activeEra.worldData.narrativeAnchors.map((anchor, idx) => (
                          <div key={idx} className="flex gap-3 items-start bg-black/20 p-3 rounded-xl border border-white/5 group transition-colors hover:bg-black/40">
                            <div className="mt-1 text-amber-500">
                              <MapPin className="w-4 h-4" />
                            </div>
                            <div className="flex-1">
                              <div className="font-bold text-white flex items-center gap-2">
                                {anchor.location}：【{anchor.name}】
                              </div>
                              <div className="text-sm text-neutral-400 mt-1 leading-relaxed">
                                {anchor.description}
                              </div>
                            </div>
                            <button
                              onClick={() => handleGeneratePOV(anchor)}
                              disabled={povLoading === anchor.name}
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-amber-500/20 hover:bg-amber-500/40 text-amber-400 rounded-lg shrink-0 flex items-center gap-2 disabled:opacity-50"
                              title="生成第一视角切片"
                            >
                              {povLoading === anchor.name ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
                              <span className="text-xs font-medium hidden sm:inline">降落</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 生态图鉴 */}
                    <div className="glass-panel p-6 rounded-2xl space-y-4">
                      <h3 className="epic-title text-xl text-amber-500 border-b border-white/10 pb-2 flex items-center gap-2">
                        <Leaf className="w-5 h-5" />
                        生态图鉴 (Flora & Fauna)
                      </h3>
                      <div className="space-y-4">
                        {activeEra.worldData.ecology.map((item, idx) => (
                          <div key={idx} className="bg-black/40 border border-white/5 rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-amber-400 font-bold">{item.name}</span>
                              <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-neutral-300">
                                {item.type === 'flora' ? '植物' : '动物'}
                              </span>
                              <span className="text-xs text-neutral-500">@ {item.location}</span>
                            </div>
                            <div className="text-sm text-neutral-300 leading-relaxed">
                              {item.description}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 贸易与文明 */}
                    <div className="glass-panel p-6 rounded-2xl space-y-4">
                      <h3 className="epic-title text-xl text-amber-500 border-b border-white/10 pb-2 flex items-center gap-2">
                        <Route className="w-5 h-5" />
                        贸易与文明 (Trade Routes)
                      </h3>
                      <div className="space-y-4">
                        {activeEra.worldData.tradeRoutes.map((route, idx) => (
                          <div key={idx} className="bg-black/40 border border-white/5 rounded-xl p-4">
                            <div className="font-bold text-amber-400 mb-1">{route.name}</div>
                            <div className="text-xs text-neutral-400 mb-2">{route.path}</div>
                            <div className="text-sm text-neutral-300 leading-relaxed mb-3">
                              {route.description}
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {route.goods.map((good, gIdx) => (
                                <span key={gIdx} className="text-xs px-2 py-1 rounded bg-amber-900/30 text-amber-200 border border-amber-500/20 flex items-center gap-1">
                                  <Package className="w-3 h-3" />
                                  {good}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* POV Gallery */}
                    {savedPOVs.length > 0 && (
                      <div className="glass-panel p-6 rounded-2xl space-y-4 md:col-span-2">
                        <h3 className="epic-title text-xl text-amber-500 border-b border-white/10 pb-2 flex items-center gap-2">
                          <Camera className="w-5 h-5" />
                          沉浸式切片画廊 (POV Gallery)
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                          {savedPOVs.map(pov => (
                            <div
                              key={pov.id}
                              className="relative group cursor-pointer rounded-xl overflow-hidden border border-white/10 aspect-video"
                              onClick={() => setPovResult(pov)}
                            >
                              <img src={pov.imageUrl} alt={pov.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                                <span className="text-white text-xs font-medium truncate drop-shadow-md">{pov.name}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              ) : (
                <div className="h-full min-h-[600px] glass-panel rounded-2xl flex flex-col items-center justify-center text-neutral-500 p-8 text-center border-dashed border-2 border-white/5">
                  <Compass className="w-16 h-16 mb-4 opacity-20" />
                  <h3 className="epic-title text-2xl text-neutral-400 mb-2">等待召唤</h3>
                  <p className="max-w-md">
                    在左侧输入你的 OC 设定，选择一种视觉风格，AI 架构师将为你推演专属的奇幻世界地图。
                  </p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* Book Modal */}
      <AnimatePresence>
        {showBookModal && activeEra && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 bg-black/90 backdrop-blur-md overflow-y-auto"
            onClick={() => setShowBookModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#0f0f0f] border border-white/10 rounded-3xl overflow-hidden max-w-3xl w-full shadow-2xl my-auto"
            >
              <div className="relative">
                <img src={activeEra.imageUrl} alt="Map" className="w-full aspect-[16/9] object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f0f] via-[#0f0f0f]/20 to-transparent" />
              </div>
              <div className="px-8 pb-10 -mt-20 relative z-10 flex flex-col items-center text-center">
                <Compass className="w-12 h-12 text-amber-500/50 mb-6" />
                <div className="epic-title text-2xl md:text-4xl text-amber-400 mb-8 leading-relaxed max-w-2xl">
                  "{activeEra.worldData.epicIntro}"
                </div>
                
                <div className="w-16 h-[1px] bg-amber-500/30 mb-8" />
                
                <div className="text-sm text-neutral-500 uppercase tracking-[0.2em] mb-10">
                  MythosForge · {activeEra.eraName}
                </div>

                <div className="flex flex-wrap justify-center gap-4">
                  <button 
                    onClick={() => setShowBookModal(false)}
                    className="px-8 py-3 rounded-full border border-white/10 hover:bg-white/5 text-white transition-colors font-medium"
                  >
                    返回编辑
                  </button>
                  <a 
                    href={activeEra.imageUrl}
                    download={`mythos-forge-${activeEra.eraName}.png`}
                    className="px-8 py-3 rounded-full bg-amber-600 hover:bg-amber-500 text-white flex items-center gap-2 transition-colors font-medium shadow-lg shadow-amber-900/20"
                  >
                    <Download className="w-5 h-5" />
                    保存地图
                  </a>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* POV Modal */}
      <AnimatePresence>
        {povResult && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 md:p-8 bg-black/95 backdrop-blur-xl"
            onClick={() => setPovResult(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#0f0f0f] border border-white/10 rounded-3xl overflow-hidden max-w-5xl w-full shadow-2xl relative"
            >
              <button
                onClick={() => setPovResult(null)}
                className="absolute top-4 right-4 z-10 p-2 bg-black/50 hover:bg-black/80 text-white rounded-full transition-colors backdrop-blur-md"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="relative">
                <img src={povResult.imageUrl} alt={`POV of ${povResult.name}`} className="w-full aspect-[16/9] object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f0f] via-transparent to-transparent" />
              </div>
              <div className="px-8 pb-8 -mt-16 relative z-10">
                <div className="flex items-center gap-3 mb-2">
                  <Eye className="w-6 h-6 text-amber-500" />
                  <h3 className="text-3xl font-bold text-amber-400 drop-shadow-lg">{povResult.name}</h3>
                </div>
                <p className="text-neutral-300 text-sm flex items-center gap-2">
                  {ocImage ? (
                    <><Sparkles className="w-4 h-4 text-amber-500" /> 已将您的 OC 渲染至该场景中。</>
                  ) : (
                    '地面视角渲染完成。上传 OC 形象可将其置入场景。'
                  )}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Export Modal */}
      <AnimatePresence>
        {showExportModal && activeEra && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 sm:p-8"
          >
            <div className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-4xl max-h-full flex flex-col overflow-hidden shadow-2xl">
              <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/50">
                <h2 className="epic-title text-xl text-amber-500 flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  世界志长图预览
                </h2>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleExport}
                    disabled={isExporting}
                    className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    保存长图
                  </button>
                  <button
                    onClick={() => setShowExportModal(false)}
                    className="p-2 rounded-lg hover:bg-white/10 text-neutral-400 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-neutral-900/50 custom-scrollbar">
                {/* The actual exportable content */}
                <div 
                  ref={exportRef} 
                  className="bg-[#0a0a0a] text-neutral-200 p-8 sm:p-12 max-w-3xl mx-auto border border-white/5 shadow-2xl relative overflow-hidden"
                  style={{ backgroundImage: 'radial-gradient(circle at 50% 0%, #2a1a0a 0%, #0a0a0a 70%)' }}
                >
                  {/* Decorative corners */}
                  <div className="absolute top-4 left-4 w-16 h-16 border-t-2 border-l-2 border-amber-500/30 rounded-tl-xl"></div>
                  <div className="absolute top-4 right-4 w-16 h-16 border-t-2 border-r-2 border-amber-500/30 rounded-tr-xl"></div>
                  <div className="absolute bottom-4 left-4 w-16 h-16 border-b-2 border-l-2 border-amber-500/30 rounded-bl-xl"></div>
                  <div className="absolute bottom-4 right-4 w-16 h-16 border-b-2 border-r-2 border-amber-500/30 rounded-br-xl"></div>

                  {/* Header */}
                  <div className="text-center mb-12 relative z-10">
                    <Compass className="w-12 h-12 text-amber-500 mx-auto mb-4 opacity-80" />
                    <h1 className="epic-title text-4xl sm:text-5xl font-bold tracking-widest text-amber-500 mb-4">
                      {activeEra.eraName}
                    </h1>
                    <p className="font-serif italic text-lg sm:text-xl text-amber-200/80 max-w-2xl mx-auto leading-relaxed">
                      "{activeEra.worldData.epicIntro}"
                    </p>
                  </div>

                  {/* Map */}
                  <div className="mb-12 relative z-10">
                    <div className="p-2 bg-black/40 rounded-xl border border-white/10 shadow-2xl">
                      <img 
                        src={activeEra.imageUrl} 
                        alt="World Map" 
                        className="w-full h-auto rounded-lg"
                        crossOrigin="anonymous"
                      />
                    </div>
                  </div>

                  {/* World Overview & OC */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-12 relative z-10">
                    <div className="space-y-4">
                      <h3 className="epic-title text-2xl text-amber-500 border-b border-white/10 pb-2">世界总览</h3>
                      <p className="text-neutral-300 leading-relaxed text-sm sm:text-base">
                        {activeEra.worldData.worldOverview}
                      </p>
                    </div>
                    <div className="space-y-4">
                      <h3 className="epic-title text-2xl text-amber-500 border-b border-white/10 pb-2">创世者 (OC)</h3>
                      <div className="flex gap-4 items-start">
                        {ocImage && (
                          <img 
                            src={`data:${ocImage.mimeType};base64,${ocImage.base64}`} 
                            alt="OC" 
                            className="w-20 h-20 rounded-lg object-cover border border-white/10 shrink-0"
                          />
                        )}
                        <p className="text-neutral-300 leading-relaxed text-sm sm:text-base italic">
                          "{ocDescription}"
                        </p>
                      </div>
                      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mt-4">
                        <div className="font-bold text-amber-400 mb-1 flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          {activeEra.worldData.ocResidence.name}
                        </div>
                        <div className="text-sm text-amber-200/70 leading-relaxed">
                          {activeEra.worldData.ocResidence.description}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* POVs if any */}
                  {savedPOVs.length > 0 && (
                    <div className="mb-12 relative z-10">
                      <h3 className="epic-title text-2xl text-amber-500 border-b border-white/10 pb-2 mb-6 text-center">
                        沉浸式切片 (POV)
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        {savedPOVs.slice(0, 4).map(pov => (
                          <div key={pov.id} className="rounded-xl overflow-hidden border border-white/10 relative">
                            <img 
                              src={pov.imageUrl} 
                              alt={pov.name} 
                              className="w-full aspect-video object-cover"
                              crossOrigin="anonymous"
                            />
                            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 to-transparent p-3 pt-8">
                              <span className="text-white text-sm font-medium drop-shadow-md">{pov.name}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="text-center mt-16 pt-8 border-t border-white/10 relative z-10">
                    <div className="flex items-center justify-center gap-2 text-neutral-500 mb-2">
                      <Compass className="w-4 h-4" />
                      <span className="epic-title tracking-widest uppercase text-sm">MythosForge</span>
                    </div>
                    <p className="text-xs text-neutral-600">Generated by AI Studio · OC Fantasy Map Generator</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
