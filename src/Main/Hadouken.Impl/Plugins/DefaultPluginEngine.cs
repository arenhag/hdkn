﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using Hadouken.Plugins;
using Hadouken.Data;
using Hadouken.Data.Models;

namespace Hadouken.Impl.Plugins
{
    public class DefaultPluginEngine : IPluginEngine
    {
        private Dictionary<string, IPluginManager> _managers = new Dictionary<string, IPluginManager>(StringComparer.InvariantCultureIgnoreCase);

        private IDataRepository _repo;
        private IMigratorRunner _runner;
        private IPluginLoader[] _loaders;

        public DefaultPluginEngine(IDataRepository repo, IMigratorRunner runner, IPluginLoader[] loaders)
        {
            _repo = repo;
            _runner = runner;
            _loaders = loaders;
        }

        public void Refresh()
        {
            // load all PluginInfo where Name not in _managers.Keys
            var infos = _repo.List<PluginInfo>(pi => !_managers.Keys.Contains(pi.Name));

            foreach (PluginInfo info in infos)
            {
                var manager = new DefaultPluginManager(info, _runner, _loaders);
                manager.Initialize();

                _managers.Add(manager.Name, manager);
            }
        }

        public void UnloadAll()
        {
            //
        }

        public IDictionary<string, IPluginManager> Managers
        {
            get { return _managers; }
        }
    }
}