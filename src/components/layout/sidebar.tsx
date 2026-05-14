import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, LayoutDashboard, Bot, Layers, FolderOpen, PanelLeft, Download, X, Loader2, MoreHorizontal, ChevronRight, Check } from 'lucide-react';
import { PremiumShare, PremiumEdit, PremiumStar, PremiumFolder, PremiumTrash, PremiumSearch, PremiumDashboard, PremiumBot, PremiumLayers, PremiumFolderOpen, PremiumPanelLeft, PremiumDownload, PremiumMoreHorizontal, PremiumCheckSquare } from '../ui/premium-icons';
import { Tooltip } from '../ui/tooltip';

interface ChatSession {
  id: string;
  title: string;
  updatedAt: number;
  traceLogs: any[];
  isFavorite?: boolean;
}

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  createNewChat: () => void;
  chats: ChatSession[];
  activeChatId: string | null;
  loadChat: (id: string) => void;
  deleteChat: (id: string) => void;
  renameChat: (id: string, newTitle: string) => void;
  toggleFavorite: (id: string) => void;
  onSearchClick: () => void;
  activeView: 'chat' | 'code' | 'agents';
  setActiveView: (view: 'chat' | 'code' | 'agents') => void;
  runningChats?: Set<string>;
  onSettingsClick?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen, setIsOpen, createNewChat, chats, activeChatId, loadChat, deleteChat, renameChat, toggleFavorite, onSearchClick, activeView, setActiveView, runningChats, onSettingsClick
}) => {
  const [menuState, setMenuState] = React.useState<{ id: string, x: number, y: number, dropUp: boolean } | null>(null);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  const [editingChatId, setEditingChatId] = React.useState<string | null>(null);
  const [editTitle, setEditTitle] = React.useState('');
  const [shareCopiedId, setShareCopiedId] = React.useState<string | null>(null);

  const [isSelectMode, setIsSelectMode] = React.useState(false);
  const [selectedChatIds, setSelectedChatIds] = React.useState<Set<string>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [isDeleteCompleteFade, setIsDeleteCompleteFade] = React.useState(false);

  // Smart drag selection states
  const [isDragSelecting, setIsDragSelecting] = React.useState(false);
  const [dragSelectState, setDragSelectState] = React.useState<boolean>(true);

  React.useEffect(() => {
    const handlePointerUp = () => setIsDragSelecting(false);
    if (isDragSelecting) {
      window.addEventListener('pointerup', handlePointerUp);
      return () => window.removeEventListener('pointerup', handlePointerUp);
    }
  }, [isDragSelecting]);

  // Auto-scroll logic for drag selection
  React.useEffect(() => {
    let scrollInterval: any = null;
    let currentDir: 'up' | 'down' | null = null;
    
    const handlePointerMove = (e: PointerEvent) => {
      if (!isDragSelecting || !scrollContainerRef.current) return;
      
      const rect = scrollContainerRef.current.getBoundingClientRect();
      const edgeThreshold = 50; // pixels from edge to trigger scroll
      const scrollSpeed = 12;
      
      if (e.clientY < rect.top + edgeThreshold) {
        if (currentDir !== 'up') {
          if (scrollInterval) clearInterval(scrollInterval);
          currentDir = 'up';
          scrollInterval = setInterval(() => {
            if (scrollContainerRef.current) scrollContainerRef.current.scrollTop -= scrollSpeed;
          }, 16);
        }
      } else if (e.clientY > rect.bottom - edgeThreshold) {
        if (currentDir !== 'down') {
          if (scrollInterval) clearInterval(scrollInterval);
          currentDir = 'down';
          scrollInterval = setInterval(() => {
            if (scrollContainerRef.current) scrollContainerRef.current.scrollTop += scrollSpeed;
          }, 16);
        }
      } else {
        if (currentDir !== null) {
          if (scrollInterval) clearInterval(scrollInterval);
          currentDir = null;
        }
      }
    };
    
    if (isDragSelecting) {
      window.addEventListener('pointermove', handlePointerMove);
      return () => {
        window.removeEventListener('pointermove', handlePointerMove);
        if (scrollInterval) clearInterval(scrollInterval);
      };
    }
  }, [isDragSelecting]);

  const handleBulkDelete = () => {
    if (isDeleting) return;
    setIsDeleting(true);
    
    // Simulate a brief backend processing delay for the beautiful UI
    setTimeout(() => {
      selectedChatIds.forEach(id => deleteChat(id));
      setSelectedChatIds(new Set());
      
      setIsDeleting(false);
      setShowDeleteConfirm(false);
      setIsSelectMode(false);
    }, 800); // 800ms loading spinner duration
  };

  const handleShare = (id: string) => {
    const chatToShare = chats.find(c => c.id === id);
    if (chatToShare) {
      navigator.clipboard.writeText(`Shared Session: ${ chatToShare.title }`);
      setShareCopiedId(id);
      setTimeout(() => setShareCopiedId(null), 2000);
    }
  };

  React.useEffect(() => {
    const handleClickOutside = () => setMenuState(null);
    if (menuState) {
      document.addEventListener('click', handleClickOutside);
    }
    return () => document.removeEventListener('click', handleClickOutside);
  }, [menuState]);

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="border-r border-white/5 bg-[#0A0A0A] flex flex-col flex-shrink-0 z-[60] h-full rounded-tr-[32px] rounded-br-[32px] overflow-visible"
          >
            <div className="p-3">
              <div className="px-3 py-3 font-serif text-[25px] text-[#E8E6E3] font-medium flex items-center justify-between cursor-pointer transition-opacity tracking-tight">
                <span className="hover:opacity-80 transition-opacity">EterX</span>
                <div
                  onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
                  className="p-1.5 rounded-md hover:bg-white/10 active:bg-white/20 active:scale-95 transition-all duration-300 ease-out text-[#8C8A88] hover:text-white flex items-center justify-center cursor-pointer"
                >
                  <PremiumPanelLeft className="w-[18px] h-[18px]" strokeWidth={2.2} />
                </div>
              </div>

              <div className="space-y-[2px] mt-2">
                <Tooltip text="Start a fresh conversation" side="right">
                  <button
                    onClick={() => { createNewChat(); setActiveView('chat'); }}
                    className="w-full flex items-center justify-between px-3 py-2.5 text-[14px] font-medium text-[#E8E6E3] bg-white/[0.03] border border-white/[0.06] rounded-[14px] transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] hover:bg-white/[0.08] hover:border-white/[0.15] active:scale-95 shadow-[0_4px_20px_rgba(0,0,0,0.3),inset_0_1px_1px_rgba(255,255,255,0.05)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.1)] group relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-white/0 to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                    <div className="flex items-center gap-3 relative z-10">
                      <div className="w-[28px] h-[28px] flex items-center justify-center bg-white/[0.04] border border-white/[0.08] rounded-[10px] group-hover:bg-white/[0.12] group-hover:border-white/[0.2] group-hover:shadow-[0_2px_8px_rgba(255,255,255,0.1)] transition-all duration-500 shadow-sm">
                        <Plus className="w-[16px] h-[16px] text-[#E8E6E3] group-hover:rotate-90 group-hover:scale-110 transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)]" strokeWidth={2.5} />
                      </div>
                      New chat
                    </div>
                    <span className="text-[10px] text-white/20 tracking-widest font-mono group-hover:text-white/40 transition-colors"></span>
                  </button>
                </Tooltip>

                <div className="h-2"></div>

                <Tooltip text="Search conversations" side="right">
                  <button
                    onClick={onSearchClick}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-[14px] font-medium text-[#A3A19E] hover:text-[#E8E6E3] hover:bg-white/[0.06] active:bg-white/10 rounded-[14px] transition-all duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] active:scale-95 group hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.03)]"
                  >
                    <PremiumSearch className="w-[18px] h-[18px] text-[#8C8A88] group-hover:text-[#E8E6E3] group-hover:scale-110 transition-all duration-300 ease-out" strokeWidth={2.2} /> Search
                  </button>
                </Tooltip>
                <Tooltip text="Manage workspace" side="right">
                  <button className="w-full flex items-center gap-3 px-3 py-2.5 text-[14px] font-medium text-[#A3A19E] hover:text-[#E8E6E3] hover:bg-white/[0.06] active:bg-white/10 rounded-[14px] transition-all duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] active:scale-95 group hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.03)]">
                    <PremiumDashboard className="w-[18px] h-[18px] text-[#8C8A88] group-hover:text-[#E8E6E3] group-hover:scale-110 transition-all duration-300 ease-out" strokeWidth={2.2} /> Workspace
                  </button>
                </Tooltip>

                <Tooltip text="Manage agents" side="right">
                  <button
                    onClick={() => setActiveView('agents')}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-[14px] font-medium rounded-[14px] transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] active:scale-95 group border relative overflow-hidden ${ activeView === 'agents'
                      ? 'bg-white/[0.08] text-[#E8E6E3] border-white/10 shadow-[0_0_20px_rgba(255,255,255,0.05),inset_0_1px_1px_rgba(255,255,255,0.05)]'
                      : 'text-[#A3A19E] hover:text-[#E8E6E3] hover:bg-white/[0.06] hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.03)] active:bg-white/10 border-transparent'
                      }`}
                  >
                    {activeView === 'agents' && <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0 pointer-events-none" />}
                    <PremiumBot className={`w-[18px] h-[18px] transition-all duration-500 ease-out relative z-10 ${ activeView === 'agents' ? 'text-[#E8E6E3] drop-shadow-[0_0_8px_rgba(255,255,255,0.4)] scale-110' : 'text-[#8C8A88] group-hover:text-[#E8E6E3] group-hover:scale-110'
                      }`} strokeWidth={2.2} /> <span className="relative z-10">Agents</span>
                  </button>
                </Tooltip>
                <Tooltip text="View channels" side="right">
                  <button className="w-full flex items-center gap-3 px-3 py-2.5 text-[14px] font-medium text-[#A3A19E] hover:text-[#E8E6E3] hover:bg-white/[0.06] active:bg-white/10 rounded-[14px] transition-all duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] active:scale-95 group hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.03)]">
                    <PremiumLayers className="w-[18px] h-[18px] text-[#8C8A88] group-hover:text-[#E8E6E3] group-hover:scale-110 transition-all duration-300 ease-out" strokeWidth={2.2} /> Channels
                  </button>
                </Tooltip>
                <Tooltip text="File Manager" side="right">
                  <button className="w-full flex items-center gap-3 px-3 py-2.5 text-[14px] font-medium text-[#A3A19E] hover:text-[#E8E6E3] hover:bg-white/[0.06] active:bg-white/10 rounded-[14px] transition-all duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] active:scale-95 group hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.03)]">
                    <PremiumFolderOpen className="w-[18px] h-[18px] text-[#8C8A88] group-hover:text-[#E8E6E3] group-hover:scale-110 transition-all duration-300 ease-out" strokeWidth={2.2} /> File Manager
                  </button>
                </Tooltip>
              </div>
            </div>

            {/* Recents List */}
            <div className="flex-1 mt-1 mx-[6px] mb-[6px] bg-gradient-to-b from-[#151515]/80 to-[#0A0A0A]/90 backdrop-blur-2xl rounded-[20px] border border-white/[0.03] shadow-[0_4px_30px_rgba(0,0,0,0.4)] flex flex-col py-3 overflow-hidden relative">
              <div className="flex items-center justify-between px-4 mb-2 relative z-30">
                <div className="text-[10px] font-bold text-[#555350] uppercase tracking-[0.2em] shrink-0 transition-colors duration-300">
                  {isSelectMode ? `${selectedChatIds.size} Selected` : 'Chats'}
                </div>
                <div className="flex items-center gap-1">
                  <AnimatePresence mode="popLayout">
                    {isSelectMode ? (
                      <motion.div
                        key="select-actions"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="flex items-center gap-1"
                      >
                        <Tooltip text="Delete selected" side="right">
                          <button
                            onClick={(e) => { e.stopPropagation(); selectedChatIds.size > 0 && setShowDeleteConfirm(true); }}
                            className={`p-1 rounded-[6px] transition-colors ${selectedChatIds.size > 0 ? 'text-[#EF4444] hover:bg-red-500/10' : 'text-[#555350] cursor-not-allowed'}`}
                          >
                            <PremiumTrash className="w-[14px] h-[14px]" />
                          </button>
                        </Tooltip>
                        <Tooltip text="Cancel selection" side="right">
                          <button
                            onClick={(e) => { e.stopPropagation(); setIsSelectMode(false); setSelectedChatIds(new Set()); }}
                            className="p-1 rounded-[6px] text-[#A3A19E] hover:bg-white/10 hover:text-white transition-colors"
                          >
                            <X className="w-[14px] h-[14px]" strokeWidth={2.5} />
                          </button>
                        </Tooltip>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="select-trigger"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                      >
                        <Tooltip text="Select multiple chats" side="right">
                          <button
                            onClick={(e) => { e.stopPropagation(); setIsSelectMode(true); }}
                            className="p-1 rounded-[6px] text-[#555350] hover:text-[#A3A19E] hover:bg-white/5 transition-colors"
                          >
                            <PremiumCheckSquare className="w-[14px] h-[14px]" />
                          </button>
                        </Tooltip>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <div
                ref={scrollContainerRef}
                className="flex-1 overflow-y-auto eterx-modern-scrollbar px-2 space-y-[3px] relative z-10"
              >
                {chats.length === 0 ? (
                  <div className="px-3 py-2 text-[13px] text-[#555350] italic">No active projects</div>
                ) : (
                  chats.map((chat, index) => {
                    const isActive = activeChatId === chat.id && activeView === 'chat';
                    const isWorking = runningChats?.has(chat.id) ?? false;
                    const isMenuOpen = menuState?.id === chat.id;

                    return (
                      <div
                        key={chat.id}
                        onPointerDown={(e) => {
                          if (isSelectMode) {
                            e.preventDefault(); // prevent text selection
                            setIsDragSelecting(true);
                            const willSelect = !selectedChatIds.has(chat.id);
                            setDragSelectState(willSelect);
                            setSelectedChatIds(prev => {
                              const next = new Set(prev);
                              if (willSelect) next.add(chat.id);
                              else next.delete(chat.id);
                              return next;
                            });
                          }
                        }}
                        onPointerEnter={(e) => {
                          if (isSelectMode && isDragSelecting) {
                            setSelectedChatIds(prev => {
                              const next = new Set(prev);
                              if (dragSelectState) next.add(chat.id);
                              else next.delete(chat.id);
                              return next;
                            });
                          }
                        }}
                        onClick={() => { 
                          if (!isSelectMode) {
                            loadChat(chat.id); setActiveView('chat'); 
                          }
                        }}
                        className={`w-full h-[46px] text-left px-3.5 transition-all duration-200 ease-[cubic-bezier(0.2,0.8,0.2,1)] flex items-center justify-between group cursor-pointer active:scale-[0.985] text-[13.5px] leading-none rounded-[14px] border relative z-0 ${ isActive && !isSelectMode ? 'bg-[#242424]/88 text-[#E8E6E3] border-white/[0.055] font-medium shadow-[inset_0_1px_0_rgba(255,255,255,0.035),0_8px_18px_rgba(0,0,0,0.18)]' : isWorking && !isSelectMode ? 'bg-white/[0.035] text-[#E8E6E3] border-white/[0.035]' : 'text-[#A3A19E] border-transparent hover:bg-white/[0.055] active:bg-white/[0.08] hover:text-[#E8E6E3]' } ${isSelectMode && selectedChatIds.has(chat.id) ? 'bg-white/[0.055] text-[#E8E6E3] border-white/[0.06]' : ''} ${isSelectMode ? 'select-none touch-none' : ''}`}
                      >
                        <div className="flex items-center overflow-hidden flex-1 relative z-10 w-full">
                          <div className={`transition-all duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] overflow-hidden flex items-center justify-center shrink-0 ${isSelectMode ? 'w-[14px] h-[14px] mr-2 rounded-[4px] border opacity-100' : 'w-0 h-[14px] mr-0 border-0 opacity-0'} ${selectedChatIds.has(chat.id) ? 'bg-[#E8E6E3] border-[#E8E6E3] text-[#0A0A0A]' : 'border-white/20 bg-transparent text-transparent group-hover:border-white/40'}`}>
                            <Check className="w-[10px] h-[10px] shrink-0" strokeWidth={3} />
                          </div>
                          {isWorking ? (
                            <motion.span
                              animate={{ backgroundPosition: ["200% 50%", "-200% 50%"] }}
                              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                              style={{ backgroundSize: '300% auto' }}
                              className="truncate pr-2 relative z-10 bg-gradient-to-r from-[#555350] via-[#E8E6E3] to-[#555350] bg-clip-text text-transparent font-medium leading-none"
                            >
                              {chat.title}
                            </motion.span>
                          ) : editingChatId === chat.id ? (
                            <input
                              autoFocus
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              onBlur={() => {
                                if (editTitle.trim() && editTitle !== chat.title) renameChat(chat.id, editTitle.trim());
                                setEditingChatId(null);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  if (editTitle.trim() && editTitle !== chat.title) renameChat(chat.id, editTitle.trim());
                                  setEditingChatId(null);
                                } else if (e.key === 'Escape') {
                                  setEditingChatId(null);
                                }
                              }}
                              className="bg-transparent border-none outline-none text-[#E8E6E3] font-medium w-full text-[13.5px] leading-none relative z-10 p-0 m-0"
                              onClick={(e) => e.stopPropagation()}
                            />
                          ) : (
                            <div className="flex items-center truncate pr-2 relative z-10 w-full min-w-0">
                              {chat.isFavorite && <PremiumStar className="w-3.5 h-3.5 text-yellow-500/90 mr-1.5 shrink-0 drop-shadow-[0_0_6px_rgba(234,179,8,0.4)]" />}
                              <span className="truncate text-[#E8E6E3] leading-none">{chat.title}</span>
                            </div>
                          )}
                        </div>

                        {/* Loading Spinner — works for both active and background running chats */}
                        {isWorking && (
                          <div className={`absolute right-0 top-0 bottom-0 w-[4.5rem] pointer-events-none z-20 flex items-center justify-end pr-3 ${isActive ? 'bg-gradient-to-l from-[#242424] via-[#242424]/92 to-transparent rounded-r-[14px]' : 'bg-gradient-to-l from-[#141414] via-[#141414]/90 to-transparent rounded-r-[14px]'}`}>
                            <div className="w-[14px] h-[14px] rounded-full border-[2px] border-[#1e3a8a] border-r-[#3b82f6] animate-[spin_0.8s_linear_infinite]" />
                          </div>
                        )}

                        <div className="relative ml-1 flex h-7 w-7 shrink-0 items-center justify-center">
                          <div
                            className={`flex h-7 w-7 items-center justify-center rounded-[10px] transition-all duration-200 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${ isMenuOpen ? 'opacity-100 bg-white/[0.12] text-[#E8E6E3] shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] border border-white/10' : (isWorking || isSelectMode ? 'opacity-0 pointer-events-none hidden' : 'opacity-0 group-hover:opacity-100 text-[#8C8A88] hover:bg-white/[0.08] hover:text-[#E8E6E3] border border-transparent hover:border-white/5 hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] active:scale-95') } relative z-40`}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (isWorking) return;
                              if (isMenuOpen) {
                                setMenuState(null);
                              } else {
                                const rect = e.currentTarget.getBoundingClientRect();
                                const dropUp = rect.bottom + 220 > window.innerHeight;
                                setMenuState({ id: chat.id, x: rect.right, y: dropUp ? rect.top : rect.bottom, dropUp });
                              }
                            }}
                          >
                            <PremiumMoreHorizontal className={`w-4 h-4 transition-transform duration-300 ${isMenuOpen ? 'scale-110 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]' : ''}`} />
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

            </div>

            {/* Bottom Profile Area */}
            <div className="p-3 border-t border-white/5 bg-[#050505] rounded-br-[32px]">
              <Tooltip text="User settings & plan" side="right">
                <div onClick={onSettingsClick} className="flex items-center justify-between cursor-pointer group px-2 py-2 hover:bg-white/5 rounded-xl w-full transition-colors border border-transparent hover:border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#32312F] to-[#1C1B1A] flex items-center justify-center text-[#E8E6E3] font-semibold text-xs shrink-0 border border-white/10 shadow-inner">
                      H
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[13px] font-medium text-white group-hover:text-[#E8E6E3]">harshil</span>
                      <span className="text-[11px] text-[#A3A19E]"></span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <PremiumDownload className="w-4 h-4 text-[#8C8A88] group-hover:text-white transition-all duration-300 group-hover:scale-110" strokeWidth={2.2} />
                    <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(52,211,153,0.6)]"></div>
                  </div>
                </div>
              </Tooltip>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {menuState && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[999999]"
          onClick={(e) => { e.stopPropagation(); setMenuState(null); }}
          onContextMenu={(e) => { e.stopPropagation(); setMenuState(null); }}
        >
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, y: menuState.dropUp ? 5 : -5, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              onClick={(e) => e.stopPropagation()}
              style={{
                position: 'fixed',
                left: menuState.x - 16,
                ...(menuState.dropUp ? { bottom: window.innerHeight - menuState.y - 4 } : { top: menuState.y - 32 }),
              }}
              className="w-52 bg-[#1C1C1C]/85 backdrop-blur-3xl border border-white/[0.08] rounded-[18px] shadow-[0_20px_60px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.1)] p-1.5 flex flex-col gap-0.5"
            >
              <button
                onClick={(e) => { e.stopPropagation(); handleShare(menuState.id); }}
                className="w-full px-3 py-2 text-[13.5px] font-medium text-[#A3A19E] hover:text-[#E8E6E3] hover:bg-white/[0.06] rounded-[12px] flex items-center gap-3 transition-all duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] text-left group/btn hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] active:scale-95"
              >
                <PremiumShare className="w-4 h-4 text-[#8C8A88] group-hover/btn:text-[#E8E6E3] transition-transform duration-300 group-hover/btn:scale-110 drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]" />
                {shareCopiedId === menuState.id ? <span className="text-[#34D399]">Link copied!</span> : "Share"}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingChatId(menuState.id);
                  setEditTitle(chats.find(c => c.id === menuState.id)?.title || "");
                  setMenuState(null);
                }}
                className="w-full px-3 py-2 text-[13.5px] font-medium text-[#A3A19E] hover:text-[#E8E6E3] hover:bg-white/[0.06] rounded-[12px] flex items-center gap-3 transition-all duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] text-left group/btn hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] active:scale-95"
              >
                <PremiumEdit className="w-4 h-4 text-[#8C8A88] group-hover/btn:text-[#E8E6E3] transition-transform duration-300 group-hover/btn:scale-110 drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]" /> Rename
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFavorite(menuState.id);
                  setMenuState(null);
                }}
                className="w-full px-3 py-2 text-[13.5px] font-medium text-[#A3A19E] hover:text-[#E8E6E3] hover:bg-white/[0.06] rounded-[12px] flex items-center gap-3 transition-all duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] text-left group/btn hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] active:scale-95"
              >
                <PremiumStar className="w-4 h-4 text-[#8C8A88] group-hover/btn:text-[#E8E6E3] transition-transform duration-300 group-hover/btn:scale-110 drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]" />
                {chats.find(c => c.id === menuState.id)?.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              </button>
              <button className="w-full px-3 py-2 text-[13.5px] font-medium text-[#A3A19E] hover:text-[#E8E6E3] hover:bg-white/[0.06] rounded-[12px] flex items-center gap-3 transition-all duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] text-left justify-between group/btn cursor-not-allowed opacity-70 hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] active:scale-95" title="Coming soon">
                <div className="flex items-center gap-3">
                  <PremiumFolder className="w-4 h-4 text-[#8C8A88] group-hover/btn:text-[#E8E6E3] transition-transform duration-300 group-hover/btn:scale-110 drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]" /> Move to Project
                </div>
                <ChevronRight className="w-4 h-4 text-[#555350] transition-transform duration-300 group-hover/btn:translate-x-1" />
              </button>

              <div className="h-[1px] w-full bg-white/10 my-1 rounded-full shadow-[0_1px_0_rgba(0,0,0,0.3)]" />

              <button
                className="w-full px-3 py-2 text-[13.5px] font-medium text-[#EF4444]/90 hover:text-[#EF4444] hover:bg-[#EF4444]/15 rounded-[12px] flex items-center gap-3 transition-all duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] text-left group/btn hover:shadow-[inset_0_1px_1px_rgba(239,68,68,0.2)] active:scale-95"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteChat(menuState.id);
                  setMenuState(null);
                }}
              >
                <PremiumTrash className="w-4 h-4 transition-transform duration-300 group-hover/btn:scale-110 drop-shadow-[0_2px_4px_rgba(239,68,68,0.3)]" /> Delete
              </button>
            </motion.div>
          </AnimatePresence>
        </div>,
        document.body
      )}

      {/* Confirmation Modal */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {showDeleteConfirm && (
            <motion.div 
              className="fixed inset-0 z-[1000] flex items-center justify-center transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] bg-black/60 backdrop-blur-sm" 
              onClick={(e) => { e.stopPropagation(); !isDeleting && setShowDeleteConfirm(false); }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-[#141414] border border-white/[0.08] shadow-[0_24px_64px_rgba(0,0,0,0.6)] rounded-[24px] p-6 max-w-[360px] w-full mx-4 flex flex-col gap-6 relative overflow-hidden"
              >
                <div className="flex flex-col gap-2 relative z-10">
                  <h3 className="text-[#E8E6E3] text-[18px] font-semibold">Delete {selectedChatIds.size} chats?</h3>
                  <p className="text-[#A3A19E] text-[14px] leading-relaxed">
                    Are you sure you want to delete the selected chats? This action cannot be undone and the history will be lost forever.
                  </p>
                </div>
                <div className="flex items-center justify-end gap-3 w-full relative z-10">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={isDeleting}
                    className={`px-4 py-2 rounded-[12px] text-[#A3A19E] hover:text-[#E8E6E3] hover:bg-white/[0.05] transition-colors text-[14px] font-medium ${isDeleting ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleBulkDelete}
                    disabled={isDeleting}
                    className={`relative flex items-center justify-center gap-2 py-2 rounded-[12px] bg-[#EF4444] text-white transition-all duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] active:scale-95 text-[14px] font-medium overflow-hidden ${isDeleting ? 'w-[150px] cursor-not-allowed hover:bg-[#EF4444]' : 'w-[130px] hover:bg-[#DC2626]'}`}
                  >
                    <span className={`transition-transform duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] whitespace-nowrap ${isDeleting ? '-translate-x-3' : 'translate-x-0'}`}>
                      {isDeleting ? 'Deleting' : 'Delete Forever'}
                    </span>
                    {isDeleting && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.5, x: 10 }}
                        animate={{ opacity: 1, scale: 1, x: 0 }}
                        className="absolute right-[14px] w-[14px] h-[14px] border-[2px] border-white/20 border-t-white rounded-full animate-spin"
                      />
                    )}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
};
