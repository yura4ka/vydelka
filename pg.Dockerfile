FROM postgres

RUN apt-get update && apt-get install -y apt-transport-https
RUN echo 'deb http://private-repo-1.hortonworks.com/HDP/ubuntu14/2.x/updates/2.4.2.0 HDP main' >> /etc/apt/sources.list.d/HDP.list
RUN echo 'deb http://private-repo-1.hortonworks.com/HDP-UTILS-1.1.0.20/repos/ubuntu14 HDP-UTILS main'  >> /etc/apt/sources.list.d/HDP.list
RUN echo 'deb [arch=amd64] https://apt-mo.trafficmanager.net/repos/azurecore/ trusty main' >> /etc/apt/sources.list.d/azure-public-trusty.list

RUN apt-get install -y wget unzip \
  && rm -rf /var/lib/apt/lists/*

RUN wget https://github.com/brown-uk/dict_uk/releases/download/v6.3.1/hunspell-uk_UA_6.3.1.zip \
  && wget https://raw.githubusercontent.com/brown-uk/dict_uk/master/distr/postgresql/ukrainian.stop \
  && unzip hunspell-uk_UA_6.3.1.zip \
  && cp uk_UA.aff $(pg_config --sharedir)/tsearch_data/uk_ua.affix \
  && cp uk_UA.dic $(pg_config --sharedir)/tsearch_data/uk_ua.dict \
  && cp ukrainian.stop $(pg_config --sharedir)/tsearch_data/ukrainian.stop
