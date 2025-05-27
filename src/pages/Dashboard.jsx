import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BriefcaseIcon, UsersIcon, BuildingIcon, LogOutIcon,PlusIcon,PencilIcon,TrashIcon } from 'lucide-react';

function DashboardCompany() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [companyData, setCompanyData] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showJobModal, setShowJobModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    requisitos: '',
    salario: '',
    tipoContrato: 'CLT',
    modalidade: 'Presencial',
    localizacao: '',
    skills: [],
    beneficios: []
  });

  useEffect(() => {
    const token = localStorage.getItem('companyToken');
    if (!token) {
      navigate('/login-company');
      return;
    }

    fetchCompanyData();
  }, [navigate]);

  const fetchCompanyData = async () => {
    try {
      const token = localStorage.getItem('companyToken');
      const response = await fetch('http://localhost:3001/api/auth/empresa/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Falha na autenticação');
      }

      const data = await response.json();
      setCompanyData(data.empresa);
      await fetchCompanyJobs(data.empresa.idEmpresa);
    } catch (error) {
      console.error('Erro ao carregar dados da empresa:', error);
      setError('Erro ao carregar dados. Por favor, faça login novamente.');
      localStorage.removeItem('companyToken');
      localStorage.removeItem('companyData');
      localStorage.removeItem('isCompanyLoggedIn');
      navigate('/login-company');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCompanyJobs = async (empresaId) => {
    try {
      const token = localStorage.getItem('companyToken');
      const response = await fetch(`http://localhost:3001/api/vagas/empresa/${empresaId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Falha ao carregar vagas');
      }
      
      const data = await response.json();
      setJobs(data);
    } catch (error) {
      console.error('Erro ao carregar vagas:', error);
      setError('Falha ao carregar vagas. Por favor, tente novamente.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('companyToken');
    localStorage.removeItem('companyData');
    localStorage.removeItem('isCompanyLoggedIn');
    window.location.href = '/login-company';
  };

  const handleSubmitJob = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('companyToken');
      const jobData = {
        ...formData,
        empresaId: companyData.idEmpresa
      };
      let response;
      if (selectedJob) {
        // Edição de vaga
        response = await fetch(`http://localhost:3001/api/vagas/${selectedJob.idVaga}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(jobData)
        });
      } else {
        // Criação de vaga
        response = await fetch('http://localhost:3001/api/vagas', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(jobData)
        });
      }
      if (!response.ok) {
        throw new Error(selectedJob ? 'Falha ao editar vaga' : 'Falha ao criar vaga');
      }
      await fetchCompanyJobs(companyData.idEmpresa);
      setShowJobModal(false);
      setSelectedJob(null);
      setFormData({
        titulo: '',
        descricao: '',
        requisitos: '',
        salario: '',
        tipoContrato: 'CLT',
        modalidade: 'Presencial',
        localizacao: '',
        skills: [],
        beneficios: []
      });
    } catch (error) {
      setError(error.message);
    }
  };

  const handleDeleteJob = async (jobId) => {
    try {
      const token = localStorage.getItem('companyToken');
      const response = await fetch(`http://localhost:3001/api/vagas/${jobId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Falha ao excluir vaga');
      }

      await fetchCompanyJobs(companyData.idEmpresa);
    } catch (error) {
      setError(error.message);
    }
  };

  const renderOverview = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Vagas Ativas</p>
            <p className="text-2xl font-semibold">{jobs.length}</p>
          </div>
          <BriefcaseIcon className="h-8 w-8 text-blue-500" />
        </div>
      </div>
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Candidatos</p>
            <p className="text-2xl font-semibold">0</p>
          </div>
          <UsersIcon className="h-8 w-8 text-green-500" />
        </div>
      </div>
    </div>
  );
  const renderJobs = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Vagas Publicadas</h2>
        <button
          onClick={() => setShowJobModal(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Nova Vaga
        </button>
      </div>

      {jobs.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">Nenhuma vaga publicada ainda.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {jobs.map((job) => (
            <div key={job.idVaga} className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold">{job.titulo}</h3>
                  <p className="text-gray-600 mt-1">{job.localizacao}</p>
                  <div className="flex gap-2 mt-2">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                      {job.tipoContrato}
                    </span>
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                      {job.modalidade}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedJob(job);
                      setFormData(job);
                      setShowJobModal(true);
                    }}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                  >
                    <PencilIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDeleteJob(job.idVaga)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderJobModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-8 w-full max-w-2xl shadow-xl">
        <h2 className="text-2xl font-bold mb-6 text-gray-800 flex items-center gap-2">
          {selectedJob ? 'Editar Vaga' : 'Nova Vaga'}
        </h2>
        <form onSubmit={handleSubmitJob} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Título</label>
              <input
                type="text"
                value={formData.titulo}
                onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                placeholder="Ex: Desenvolvedor Front-end"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Localização</label>
              <input
                type="text"
                value={formData.localizacao}
                onChange={(e) => setFormData({ ...formData, localizacao: e.target.value })}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                placeholder="Ex: São Paulo, SP ou Remoto"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Descrição</label>
            <textarea
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              rows="3"
              placeholder="Descreva a vaga, o time, o desafio..."
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Requisitos</label>
            <textarea
              value={formData.requisitos}
              onChange={(e) => setFormData({ ...formData, requisitos: e.target.value })}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              rows="2"
              placeholder="Liste os requisitos essenciais para a vaga"
              required
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Salário</label>
              <input
                type="text"
                value={formData.salario}
                onChange={(e) => setFormData({ ...formData, salario: e.target.value })}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                placeholder="Ex: R$ 5.000,00"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Tipo de Contrato</label>
                <select
                  value={formData.tipoContrato}
                  onChange={(e) => setFormData({ ...formData, tipoContrato: e.target.value })}
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  required
                >
                  <option value="CLT">CLT</option>
                  <option value="PJ">PJ</option>
                  <option value="Temporário">Temporário</option>
                  <option value="Estágio">Estágio</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Modalidade</label>
                <select
                  value={formData.modalidade}
                  onChange={(e) => setFormData({ ...formData, modalidade: e.target.value })}
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  required
                >
                  <option value="Presencial">Presencial</option>
                  <option value="Remoto">Remoto</option>
                  <option value="Híbrido">Híbrido</option>
                </select>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Skills (Habilidades)</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.skills && formData.skills.map((skill, idx) => (
                  <span key={idx} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full flex items-center gap-1">
                    {skill}
                    <button type="button" className="ml-1 text-blue-600 hover:text-blue-900" onClick={() => setFormData({ ...formData, skills: formData.skills.filter((_, i) => i !== idx) })}>&times;</button>
                  </span>
                ))}
              </div>
              <input
                type="text"
                placeholder="Digite e pressione Enter"
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const value = e.target.value.trim();
                    if (value && (!formData.skills || !formData.skills.includes(value))) {
                      setFormData({ ...formData, skills: [...(formData.skills || []), value] });
                      e.target.value = '';
                    }
                  }
                }}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Benefícios</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.beneficios && formData.beneficios.map((b, idx) => (
                  <span key={idx} className="bg-green-100 text-green-800 px-3 py-1 rounded-full flex items-center gap-1">
                    {b}
                    <button type="button" className="ml-1 text-green-600 hover:text-green-900" onClick={() => setFormData({ ...formData, beneficios: formData.beneficios.filter((_, i) => i !== idx) })}>&times;</button>
                  </span>
                ))}
              </div>
              <input
                type="text"
                placeholder="Digite e pressione Enter"
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const value = e.target.value.trim();
                    if (value && (!formData.beneficios || !formData.beneficios.includes(value))) {
                      setFormData({ ...formData, beneficios: [...(formData.beneficios || []), value] });
                      e.target.value = '';
                    }
                  }
                }}
              />
            </div>
          </div>
          <div className="flex justify-end gap-4 mt-8">
            <button
              type="button"
              onClick={() => {
                setShowJobModal(false);
                setSelectedJob(null);
                setFormData({
                  titulo: '',
                  descricao: '',
                  requisitos: '',
                  salario: '',
                  tipoContrato: 'CLT',
                  modalidade: 'Presencial',
                  localizacao: '',
                  skills: [],
                  beneficios: []
                });
              }}
              className="px-5 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow"
            >
              {selectedJob ? 'Salvar Alterações' : 'Publicar Vaga'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  const renderProfile = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Informações da Empresa</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-gray-500">Nome da Empresa</p>
            <p className="text-lg font-medium">{companyData?.nomeEmpresa}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">CNPJ</p>
            <p className="text-lg font-medium">{companyData?.cnpj}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Email Corporativo</p>
            <p className="text-lg font-medium">{companyData?.emailCorporativo}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Telefone</p>
            <p className="text-lg font-medium">{companyData?.telefoneCorporativo}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Segmento</p>
            <p className="text-lg font-medium">{companyData?.segmento}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Tamanho da Empresa</p>
            <p className="text-lg font-medium">{companyData?.companySize}</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Endereço</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-gray-500">CEP</p>
            <p className="text-lg font-medium">{companyData?.endereco?.cep}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Logradouro</p>
            <p className="text-lg font-medium">{companyData?.endereco?.logradouro}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Número</p>
            <p className="text-lg font-medium">{companyData?.endereco?.numero}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Complemento</p>
            <p className="text-lg font-medium">{companyData?.endereco?.complemento || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Bairro</p>
            <p className="text-lg font-medium">{companyData?.endereco?.bairro}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Cidade/Estado</p>
            <p className="text-lg font-medium">{`${companyData?.endereco?.cidade}/${companyData?.endereco?.estado}`}</p>
          </div>
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <BuildingIcon className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-semibold">JobFlow</span>
            </div>
            <div className="flex items-center">
              <button
                onClick={handleLogout}
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                <LogOutIcon className="h-5 w-5 mr-2" />
                Sair
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              {[
                { id: 'overview', label: 'Visão Geral' },
                { id: 'jobs', label: 'Vagas' },
                { id: 'candidates', label: 'Candidatos' },
                { id: 'profile', label: 'Perfil' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-6 text-sm font-medium ${
                    activeTab === tab.id
                      ? 'border-b-2 border-blue-500 text-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && renderOverview()}
            {activeTab === 'jobs' && renderJobs()}
            {activeTab === 'candidates' && (
              <div className="text-center py-8">
                <p className="text-gray-500">Nenhum candidato ainda.</p>
              </div>
            )}
            {activeTab === 'profile' && renderProfile()}
          </div>
        </div>
      </main>

      {showJobModal && renderJobModal()}
    </div>
  );
}

export default DashboardCompany;