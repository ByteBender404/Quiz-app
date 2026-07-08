import React, { useState } from 'react';
import { Plus, Trash2, ArrowLeft, Image as ImageIcon, CheckCircle, XCircle, BrainCircuit } from 'lucide-react';
import { API_URL } from '../config';
import { useNavigate } from 'react-router-dom';

type QuestionType = 'multiple_choice' | 'true_false' | 'fill_blank';

interface QuestionState {
  id: string; // temporary for UI
  text: string;
  type: QuestionType;
  options: string[];
  correctAnswers: string[];
  file: File | null;
}

const QuizCreator: React.FC = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [questions, setQuestions] = useState<QuestionState[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // AI Generation State
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [aiTopic, setAiTopic] = useState('');
  const [aiDifficulty, setAiDifficulty] = useState('beginner');
  const [aiNumQuestions, setAiNumQuestions] = useState('5');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleAIGenerate = async () => {
    if (!aiTopic || !aiDifficulty || !aiNumQuestions) return;
    
    setIsGenerating(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/api/v1/quizzes/generate-ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: aiTopic, difficulty: aiDifficulty, numQuestions: Number(aiNumQuestions) }),
        credentials: 'include',
      });

      if (response.status === 401) {
        throw new Error('Unauthorized: Session expired. Please log in again.');
      }

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to generate AI quiz');

      // Success, route back to dashboard
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message);
      setIsGenerating(false);
    }
  };

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        id: Math.random().toString(36).substring(7),
        text: '',
        type: 'multiple_choice',
        options: ['', ''],
        correctAnswers: [],
        file: null,
      },
    ]);
  };

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter((q) => q.id !== id));
  };

  const updateQuestion = (id: string, field: keyof QuestionState, value: any) => {
    setQuestions(
      questions.map((q) => (q.id === id ? { ...q, [field]: value } : q))
    );
  };

  const handleOptionChange = (qId: string, index: number, value: string) => {
    setQuestions(
      questions.map((q) => {
        if (q.id === qId) {
          const newOptions = [...q.options];
          newOptions[index] = value;
          return { ...q, options: newOptions };
        }
        return q;
      })
    );
  };

  const addOption = (qId: string) => {
    setQuestions(
      questions.map((q) => {
        if (q.id === qId) {
          return { ...q, options: [...q.options, ''] };
        }
        return q;
      })
    );
  };

  const toggleCorrectAnswer = (qId: string, option: string) => {
    setQuestions(
      questions.map((q) => {
        if (q.id === qId) {
          if (q.type === 'multiple_choice') {
            return { ...q, correctAnswers: [option] };
          }
          const exists = q.correctAnswers.includes(option);
          const newCorrect = exists
            ? q.correctAnswers.filter((a) => a !== option)
            : [...q.correctAnswers, option];
          return { ...q, correctAnswers: newCorrect };
        }
        return q;
      })
    );
  };

  const handleFileChange = (qId: string, file: File | null) => {
    updateQuestion(qId, 'file', file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || questions.length === 0) {
      setError('Quiz must have a title and at least one question.');
      return;
    }

    for (const q of questions) {
      if (q.correctAnswers.length === 0 || (q.type === 'multiple_choice' && q.correctAnswers.length !== 1)) {
        setError('Error: Every question must have its correct answer(s) specified before transmitting.');
        return;
      }
    }

    setLoading(true);
    setError('');

    try {
      // 1. Create Quiz
      const quizRes = await fetch(`${API_URL}/api/v1/quizzes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, category }),
        credentials: 'include',
      });

      const quizData = await quizRes.json();
      if (quizRes.status === 401) throw new Error('Unauthorized: Session expired. Please log in again.');
      if (!quizRes.ok) throw new Error(quizData.message || 'Failed to create quiz');
      
      const quizId = quizData.data.quiz._id;

      // 2. Upload Questions sequentially
      for (const q of questions) {
        const formData = new FormData();
        formData.append('text', q.text);
        formData.append('type', q.type);
        formData.append('options', JSON.stringify(q.options.filter(o => o.trim() !== '')));
        formData.append('correctAnswers', JSON.stringify(q.correctAnswers));
        
        if (q.file) {
          formData.append('media', q.file);
        }

        const qRes = await fetch(`${API_URL}/api/v1/quizzes/${quizId}/questions`, {
          method: 'POST',
          body: formData,
          credentials: 'include',
        });
        
        if (qRes.status === 401) {
          throw new Error('Unauthorized: Session expired. Please log in again.');
        }
        if (!qRes.ok) {
          const qData = await qRes.json();
          throw new Error(qData.message || 'Failed to add question');
        }
      }

      // 3. Complete and redirect
      if (quizId) {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6 md:p-12 font-mono">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* AI Generator Panel */}
        <div className="glass-card mb-8 border border-tertiary/30 overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
            <Sparkles size={120} className="text-tertiary" />
          </div>
          <button 
            type="button"
            onClick={() => setAiPanelOpen(!aiPanelOpen)}
            className="w-full flex items-center justify-between text-left focus:outline-none"
          >
            <div>
              <h2 className="text-title-lg font-bold text-tertiary flex items-center gap-2 tracking-tight">
                <Sparkles size={24} className={isGenerating ? "animate-pulse" : ""} />
                GENERATE WITH AI
              </h2>
              <p className="text-body-sm text-on-surface-variant uppercase tracking-widest mt-1">
                Let the Neural Engine build a quiz module for you
              </p>
            </div>
            <div className="text-tertiary bg-tertiary/10 p-2 rounded-full">
              {aiPanelOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
          </button>
          
          {aiPanelOpen && (
            <div className="mt-6 pt-6 border-t border-tertiary/20 animate-in slide-in-from-top-4 fade-in duration-300 relative z-10">
              {isGenerating ? (
                <div className="text-center py-8">
                  <Sparkles size={48} className="mx-auto text-tertiary animate-ping mb-4" />
                  <h3 className="text-title-md font-bold text-on-surface uppercase tracking-widest">
                    INITIALIZING NEURAL ENGINE...
                  </h3>
                  <p className="text-body-sm text-tertiary mt-2">Compiling cognitive assessment vectors.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="text-label-sm block text-on-surface mb-1">TOPIC / SUBJECT</label>
                    <input
                      type="text"
                      value={aiTopic}
                      onChange={(e) => setAiTopic(e.target.value)}
                      className="input-field w-full border-tertiary/30 focus:border-tertiary focus:ring-tertiary"
                      placeholder="e.g. Advanced Quantum Mechanics"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-label-sm block text-on-surface mb-1">DIFFICULTY</label>
                      <select
                        value={aiDifficulty}
                        onChange={(e) => setAiDifficulty(e.target.value)}
                        className="input-field w-full bg-surface-container border-tertiary/30 focus:border-tertiary focus:ring-tertiary"
                      >
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                        <option value="expert">Expert</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-label-sm block text-on-surface mb-1">QUESTION COUNT</label>
                      <select
                        value={aiNumQuestions}
                        onChange={(e) => setAiNumQuestions(e.target.value)}
                        className="input-field w-full bg-surface-container border-tertiary/30 focus:border-tertiary focus:ring-tertiary"
                      >
                        <option value="5">5 Questions</option>
                        <option value="10">10 Questions</option>
                        <option value="15">15 Questions</option>
                      </select>
                    </div>
                  </div>
                  <button 
                    type="button"
                    onClick={handleAIGenerate}
                    disabled={!aiTopic}
                    className="w-full bg-tertiary text-on-tertiary py-3 rounded uppercase font-bold tracking-wider hover:bg-tertiary/90 transition-colors disabled:opacity-50 mt-4 shadow-[0_0_15px_rgba(var(--tertiary-rgb),0.4)]"
                  >
                    RUN AI ENGINE
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mb-8 border-b border-primary/20 pb-4">
          <h1 className="text-headline-lg font-bold text-primary mb-2 tracking-tight">
            QUIZ CREATOR_
          </h1>
          <p className="text-body-md text-on-surface-variant uppercase tracking-widest text-xs">
            Initialize new assessment module
          </p>
        </div>

        {error && (
          <div className="p-4 bg-error/20 border border-error text-error-container rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-12">
          {/* Quiz Metadata */}
          <div className="glass-card space-y-6">
            <h2 className="text-title-lg font-semibold text-secondary flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
              METADATA
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="text-label-sm block text-on-surface mb-1">QUIZ TITLE</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="input-field w-full text-lg font-bold"
                  placeholder="e.g. Cyber Security 101"
                  required
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-label-sm block text-on-surface mb-1">CATEGORY</label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="input-field w-full"
                    placeholder="e.g. Technology"
                  />
                </div>
                <div>
                  <label className="text-label-sm block text-on-surface mb-1">DESCRIPTION</label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="input-field w-full"
                    placeholder="Brief description..."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Questions Array */}
          <div className="space-y-6">
            <h2 className="text-title-lg font-semibold text-primary flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
              QUESTIONS SEQUENCE
            </h2>

            {questions.map((q, index) => (
              <div key={q.id} className="glass-card relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-1 h-full bg-secondary opacity-50 group-hover:opacity-100 transition-opacity"></div>
                
                <div className="flex justify-between items-start mb-6">
                  <h3 className="text-title-md font-bold text-on-surface opacity-80">
                    Q_{String(index + 1).padStart(2, '0')}
                  </h3>
                  <button
                    type="button"
                    onClick={() => removeQuestion(q.id)}
                    className="text-on-surface-variant hover:text-error transition-colors"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Question Text & Type */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <label className="text-label-sm block text-on-surface mb-1">QUESTION TEXT</label>
                      <input
                        type="text"
                        value={q.text}
                        onChange={(e) => updateQuestion(q.id, 'text', e.target.value)}
                        className="input-field w-full"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-label-sm block text-on-surface mb-1">TYPE</label>
                      <select
                        value={q.type}
                        onChange={(e) => updateQuestion(q.id, 'type', e.target.value as QuestionType)}
                        className="input-field w-full bg-surface-container"
                      >
                        <option value="multiple_choice">Multiple Choice</option>
                        <option value="true_false">True / False</option>
                        <option value="fill_blank">Fill in the Blank</option>
                      </select>
                    </div>
                  </div>

                  {/* Media Upload */}
                  <div>
                    <label className="text-label-sm block text-on-surface mb-1 flex items-center gap-2">
                      <ImageIcon size={16} /> ATTACH MEDIA (OPTIONAL)
                    </label>
                    <div className="flex items-center gap-4">
                      <label className="cursor-pointer border border-dashed border-primary/40 rounded p-4 flex items-center justify-center bg-surface-container/50 hover:bg-surface-container transition-colors w-full">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleFileChange(q.id, e.target.files ? e.target.files[0] : null)}
                        />
                        <div className="flex items-center gap-2 text-primary opacity-80">
                          <Upload size={20} />
                          <span className="uppercase text-sm">
                            {q.file ? q.file.name : 'CLICK TO UPLOAD IMAGE'}
                          </span>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Options based on Type */}
                  <div className="bg-surface-container-high/30 p-4 rounded border border-surface-container-high">
                    
                    {q.type === 'multiple_choice' && (
                      <div className="space-y-3">
                        <label className="text-label-sm block text-on-surface mb-2">OPTIONS (SELECT CORRECT ANSWERS)</label>
                        {q.options.map((opt, i) => (
                          <div key={i} className="flex gap-2 items-center">
                            <button
                              type="button"
                              onClick={() => toggleCorrectAnswer(q.id, opt)}
                              className={`p-2 rounded transition-colors ${
                                q.correctAnswers.includes(opt) && opt !== ''
                                  ? 'text-primary bg-primary/20'
                                  : 'text-on-surface-variant hover:text-on-surface'
                              }`}
                              disabled={opt === ''}
                            >
                              <CheckCircle size={20} />
                            </button>
                            <input
                              type="text"
                              value={opt}
                              onChange={(e) => handleOptionChange(q.id, i, e.target.value)}
                              className={`input-field w-full ${q.correctAnswers.includes(opt) && opt !== '' ? 'border-primary shadow-[0_0_10px_rgba(157,78,221,0.3)]' : ''}`}
                              placeholder={`Option ${i + 1}`}
                            />
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => addOption(q.id)}
                          className="text-secondary hover:text-secondary-fixed text-sm uppercase flex items-center gap-1 mt-2"
                        >
                          <Plus size={16} /> Add Option
                        </button>
                      </div>
                    )}

                    {q.type === 'true_false' && (
                      <div className="space-y-3">
                         <label className="text-label-sm block text-on-surface mb-2">CORRECT ANSWER</label>
                         <div className="flex gap-4">
                            {['True', 'False'].map((val) => (
                              <button
                                key={val}
                                type="button"
                                onClick={() => updateQuestion(q.id, 'correctAnswers', [val])}
                                className={`px-6 py-2 rounded font-bold uppercase transition-colors ${
                                  q.correctAnswers.includes(val)
                                    ? 'bg-secondary text-on-secondary'
                                    : 'bg-surface-container text-on-surface-variant'
                                }`}
                              >
                                {val}
                              </button>
                            ))}
                         </div>
                      </div>
                    )}

                    {q.type === 'fill_blank' && (
                      <div className="space-y-3">
                        <label className="text-label-sm block text-on-surface mb-2">ACCEPTED ANSWERS (COMMA SEPARATED)</label>
                        <input
                          type="text"
                          value={q.correctAnswers.join(',')}
                          onChange={(e) => updateQuestion(q.id, 'correctAnswers', e.target.value.split(',').map(s => s.trim()))}
                          className="input-field w-full"
                          placeholder="e.g. javascript, js, ecmascript"
                        />
                      </div>
                    )}

                  </div>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={addQuestion}
              className="w-full border border-dashed border-primary/50 text-primary hover:bg-primary/10 transition-colors rounded p-6 font-bold uppercase flex items-center justify-center gap-2"
            >
              <Plus size={24} /> ADD QUESTION
            </button>
          </div>

          {/* Submit */}
          <div className="pt-8">
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary text-lg py-4 relative overflow-hidden group"
            >
              <span className="relative z-10">{loading ? 'COMPILING DATA...' : 'TRANSMIT QUIZ TO MAINFRAME'}</span>
              <div className="absolute inset-0 bg-white/20 transform -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QuizCreator;
